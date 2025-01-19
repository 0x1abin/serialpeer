// peerClient.ts:
import { EventEmitter } from "eventemitter3"
import { StreamConnection } from './StreamConnection'
import { MediaConnection } from './mediaconnection'
import { OverMQTT, MQTTEventType } from './overMQTT';
import { SignalingType, ConnectionType } from "./negotiator";

const log = new Logger('peerClient');
log.logLevel = LogLevel.Debug

const iceConfigDefault = {
    iceServers: [
        {
            urls: [
                "stun:turn.uipc.app:3478",
            ],
        },
        { urls: "stun:stun.cloudflare.com:3478" },
        { urls: "stun:stun.l.google.com:19302" },
    ],
    sdpSemantics: "unified-plan",
};

export enum PeerEventType {
    Open = "open",
    Close = "close",
    Error = "error",
    Call = "call",
    Stream = "stream",
    Hangup = "hangup",
    DataConnection = "dataConnection",
    Data = "data",
    DataDisconnect = "dataDisconnect",
    IceConnectionStateChange = "iceconnectionstatechange",
}

export enum PeerNotifyEvent {
    Connected = "connected",
    Disconnected = "disconnected",
}

export class PeerClient extends EventEmitter {
    peerId: string;
    localStream: MediaStream | null = null;
    // peer: Peer | null = null;
    mediaConnection = new Map<string, MediaConnection>();
    dataConnection = new Map<string, any>();
    private _options: any;
    private mqtt: OverMQTT | undefined;

    constructor(id?: string, options?: any) {
        super();
        if (!id) id = randomPeerId();
        this.peerId = id;
        this._options = options;
    }

    getId() {
        return this.peerId;
    }

    handleOffer(peerId: string, payload: any) {
        const mediaConnection = new MediaConnection(peerId, this, {
            _payload: payload,
            config: payload.config || this._options.config,
        });
        this.emit("incall", mediaConnection);
    }

    private _onMqttMessage(message: any) {
        // log.debug('onMqttMessage:', message);
        const peerId = message.src;
        if (message?.type === 'signaling') {
            message.data.forEach((data: any) => {
                const type = data.type;
                const payload = data.payload;
                switch (type) {
                    case SignalingType.Offer:
                        this.handleOffer(peerId, payload);
                        break;
                    default:
                        this.emit(`${peerId}:signaling`, data);
                        break;
                }
            })
        }
    }

    public mqttSignaling(peerId: string, data: any) {
        if (!this.mqtt) {
            log.error('mqtt not connected');
            return;
        }
        const payload = {
            type: 'signaling',
            src: this.peerId,
            data: data,
        }
        // log.debug('mqtt signaling:', peerId, payload);
        this.mqtt.send(peerId, payload);
    }

    private startMqtt(options: any, securityKey?: string) {
        this.mqtt = new OverMQTT(this.peerId, options, securityKey);
        this.mqtt.start();
        this.mqtt.on(MQTTEventType.Open, () => {
            log.info('mqtt opened');
            this.emit('open', this.peerId);
            this.notify(PeerNotifyEvent.Connected);
        });
        this.mqtt.on(MQTTEventType.Close, () => {
            log.warn('mqtt closed');
            this.emit('close');
        });
        this.mqtt.on(MQTTEventType.Error, (err: any) => {
            log.error('mqtt error:', err);
            this.emit('error', err);
        });
        this.mqtt.on(MQTTEventType.Message, this._onMqttMessage.bind(this));
    }

    updatePeerStream(peerId: string, stream: MediaStream) {
        const call = this.mediaConnection.get(peerId);
        if (call) {
            const peerConnection = call.peerConnection;
            if (peerConnection && peerConnection.getSenders().length > 0 && stream) {
                const videoSender = peerConnection.getSenders().find((sender: RTCRtpSender) => sender.track?.kind === 'video');
                const audioSender = peerConnection.getSenders().find((sender: RTCRtpSender) => sender.track?.kind === 'audio');
                if (videoSender && stream.getVideoTracks()[0]) {
                    videoSender.replaceTrack(stream.getVideoTracks()[0]);
                }
                if (audioSender && stream.getAudioTracks()[0]) {
                    audioSender.replaceTrack(stream.getAudioTracks()[0]);
                }
            }
        }
    }

    setLocalStream(stream: MediaStream) {
        log.debug('setLocalStream:', stream);
        this.localStream = stream;
        this.mediaConnection.forEach((call, key) => {
            this.updatePeerStream(key, stream);
        }); 
    }

    start(options?: any, id?: string, securityKey?: string) {
        this._options = options || this._options;
        this.peerId = id || this.peerId;
        log.debug('start:', this.peerId, this._options);
        this.startMqtt(this._options.mqttOptions, securityKey);

        this.on('incall', (call: MediaConnection) => {
            log.info('in call:', call.peer);
            if (this.dataConnection.has(call.peer)) {
                this.dataConnection.get(call.peer)?.close();
                log.warn('replacing existing connection');
            }
            if (this.mediaConnection.has(call.peer)) {
                this.mediaConnection.get(call.peer)?.close();
                log.warn('replacing existing call');
            }
            this.mediaConnection.set(call.peer, call);
            call.answer(this.localStream!);
            call.on('stream', (stream: MediaStream) => {
                log.info('mc stream:', stream);
                this.emit('stream', {
                    peerId: call.peer,
                    stream: stream,
                    call: call,
                });
            });
            this.emit('call', {
                peerId: call.peer,
                call: call,
            });

            this.multiplexListener(call.peer);
        });

        return true;
    }

    stop() {
        log.info('stop peer service');
        this.dataConnection.forEach((conn) => {
            conn?.close();
        });
        this.mediaConnection.forEach((call) => {
            call?.close();
        });
        this.mqtt?.close();
    }

    call(peerId: string, options?: any) {
        if (this.mediaConnection.has(peerId)) {
            this.mediaConnection.get(peerId)?.close();
            log.warn('replacing existing call');
        }

        // const _options = {
        //     originator: true,
        //     constraints: { offerToReceiveAudio: true, offerToReceiveVideo: true },
        //     stream: options?.stream || this.localStream,
        //     reliable: true,
        //     config: this._options.config || iceConfigDefault,
        //     ...options,
        // }
        const call = new MediaConnection(peerId, this, {
            constraints: { offerToReceiveAudio: true, offerToReceiveVideo: true },
            _stream: options?.stream || this.localStream,
            config: this._options.config,
        });
        this.mediaConnection.set(peerId, call);
        call.on("stream", (stream: MediaStream) => {
            log.info('mc stream:', stream);
            this.emit('stream', {
                peerId: peerId,
                stream: stream,
                call: call,
            });
        });
        call.on("close", () => {
            log.info('MediaConnection close:', peerId);
            this.mediaConnection.delete(peerId);
            this.emit('hangup', {
                peerId: peerId,
                call: call,
            });
        });
        this.emit('call', {
            peerId: call.peer,
            call: call,
        });

        // candidate-pair report
        const peerConnection = call.peerConnection!;
        peerConnection.addEventListener('iceconnectionstatechange', (event) => {
            log.info('iceConnectionState:', peerConnection.iceConnectionState);
            this.emit('iceconnectionstatechange', {
                peerId: peerId,
                iceConnectionState: peerConnection.iceConnectionState,
                peerConnection: peerConnection,
            });
        });

        // datachannel connecting
        this.multiplexConnection(peerId);
        return true;
    }

    hangup(peerId: string) {
        const call = this.mediaConnection.get(peerId);
        if (call) {
            call.close();
            console.log('MediaConnection close:', peerId);
            this.mediaConnection.delete(peerId);
            this.emit('hangup', {
                peerId: peerId,
                call: call,
            });
        }
    }

    dataConnect(peerId: string, options?: any) {
        log.debug('new dataConnect:', peerId);
        if (this.dataConnection.has(peerId)) {
            this.dataConnection.get(peerId)?.close();
            log.warn('replacing existing connection');
        }

        const mediaConnection = new MediaConnection(peerId, this, {
            constraints: { offerToReceiveAudio: false, offerToReceiveVideo: false },
            config: this._options.config,
            dataOnly: true, // 标记这是一个仅数据连接
        });

        mediaConnection.on("close", () => {
            log.info('DataConnection close:', peerId);
            this.mediaConnection.delete(peerId);
            this.dataConnection.delete(peerId);
            this.emit('dataDisconnect', {
                peerId: peerId,
                connection: mediaConnection
            });
        });

        const streamConnection = new StreamConnection(mediaConnection.dataChannel!);
        streamConnection.on('open', () => {
            log.info('dataChannel opened:', peerId);
            this.dataConnection.set(peerId, streamConnection);
            this.emit('dataConnection', {
                peerId: peerId,
                connection: streamConnection,
            });
        });

        streamConnection.on('data', (data: any) => {
            this.emit('data', {
                peerId: peerId,
                data: data,
                connection: streamConnection,
            });
        });

        streamConnection.on('close', () => {
            log.info('dataChannel closed:', peerId);
            this.dataConnection.delete(peerId);
            this.emit('dataDisconnect', {
                peerId: peerId,
                connection: streamConnection,
            });
        });

        return true;
    }

    dataDisconnect(peerId: string) {
        const conn = this.mediaConnection.get(peerId);
        if (conn) {
            conn.close();
            this.mediaConnection.delete(peerId);
            this.dataConnection.delete(peerId);
        }
    }

    send(peerId: string, data: any) {
        return this.dataConnection.get(peerId)?.send(data);
    }

    broadcast(data: any, options?: { excludeId?: string[] }) {
        this.dataConnection.forEach((conn, peerId) => {
            if (options?.excludeId && options.excludeId.includes(peerId)) return;
            conn.send(data);
        });
    }

    notify(type: string, message?: any) {
        this.mqtt?.publish(`${this.peerId}:notify`, JSON.stringify({ type, message }));
    }

    watch(peerId: string, onNotify: (event: any) => void) {
        this.mqtt?.subscribe(`${peerId}:notify`, (message: any) => {
            try {
                onNotify(JSON.parse(message.toString()));
            } catch (error) {
                log.error('Error notify message:', error);
            }
        });
    }

    unwatch(peerId: string) {
        this.mqtt?.unsubscribe(`${peerId}:notify`);
    }

    private multiplexListener(peerId: string) {
        const peerConnection = this.mediaConnection.get(peerId)?.peerConnection;
        if (peerConnection) {
            log.debug('multiplexListener:', peerId);
            peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
                log.debug('ondatachannel:', event);
                const dataChannel = event.channel;
                if (dataChannel.label != 'dc:uipc') return;
                const streamConnection = new StreamConnection(dataChannel);
                streamConnection.on('open', () => {
                    log.info('multiplex dataChannel opened:', peerId);
                    this.dataConnection.set(peerId, streamConnection);
                    this.emit('dataConnection', {
                        peerId: peerId,
                        conn: streamConnection,
                    });
                });
                streamConnection.on('data', (data: any) => {
                    this.emit('data', {
                        peerId: peerId,
                        data: data,
                        conn: streamConnection,
                    });
                });
                streamConnection.on('close', () => {
                    log.info('multiplex dataChannel closed:', peerId);
                    this.dataConnection.delete(peerId);
                    this.emit('dataDisconnect', {
                        peerId: peerId,
                        conn: streamConnection,
                    });
                });
            }
        }
    }

    private multiplexConnection(peerId: string, onData?: (data: any) => boolean): boolean {
        log.debug('multiplexConnection:', peerId);
        if (!this.mediaConnection.has(peerId)) {
            log.error('media connection not exist');
            return false;
        }

        const dataChannel = this.mediaConnection.get(peerId)?.dataChannel;
        const streamConnection = new StreamConnection(dataChannel!);
        streamConnection.on('open', () => {
            log.info('multiplex dataChannel opened:', peerId);
            this.dataConnection.set(peerId, streamConnection);
            this.emit('dataConnection', {
                peerId: peerId,
                conn: streamConnection,
            });
        });
        streamConnection.on('data', (data: any) => {
            if (onData) onData(data);
            this.emit('data', {
                peerId: peerId,
                data: data,
                conn: streamConnection,
            });
        });
        streamConnection.on('close', () => {
            log.info('multiplex dataChannel closed:', peerId);
            this.dataConnection.delete(peerId);
            this.emit('dataDisconnect', {
                peerId: peerId,
                conn: streamConnection,
            });
        });

        return true;
    }
}