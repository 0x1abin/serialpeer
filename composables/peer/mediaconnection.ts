// mediaconnection.ts

// import { util } from "./util";
import { EventEmitter } from "eventemitter3"
import { Negotiator } from "./negotiator";
import { ConnectionType, SignalingType } from "./negotiator";
import type { PeerClient } from './peerClient';
// import type { Peer } from "./peer";
// import { BaseConnection, type BaseConnectionEvents } from "./baseconnection";
// import type { ServerMessage } from "./servermessage";
// import type { AnswerOption } from "./optionInterfaces";

const log = new Logger('MC');

export interface AnswerOption {
	/**
	 * Function which runs before create answer to modify sdp answer message.
	 */
	sdpTransform?: Function;
}

/**
 * Wraps WebRTC's media streams.
 * To get one, use {@apilink Peer.call} or listen for the {@apilink PeerEvents | `call`} event.
 */
export class MediaConnection extends EventEmitter {
	private _signalQueue: any[] = [];
	private _signalQueueTimer: any;
	private _signalQueueDelay = 16;
	private _negotiator: Negotiator | null;
	private _localStream: MediaStream | null;
	private _remoteStream: MediaStream | null;
	peerConnection: RTCPeerConnection | null;
	dataChannel: RTCDataChannel | null;
	provider: PeerClient;
	options: any;
	_peerId: string;
	peer = '';
	// metadata = '';
	// private static readonly ID_PREFIX = "mc_";
	// readonly label: string;
	// connectionId = '';

	/**
	 * For media connections, this is always 'media'.
	 */
	get type() {
		return ConnectionType.Media;
	}

	get localStream() {
		return this._localStream;
	}

	get remoteStream() {
		return this._remoteStream;
	}

	constructor(peerId: string, provider: PeerClient, options: any) {
		super();
		this._peerId = peerId;
		this.peer = peerId;
		this.provider = provider;
		this.options = options;
		this._remoteStream = null;
		this._localStream = options._stream;
		log.debug('MediaConnection options', options);
		this.peerConnection = null;
		this.dataChannel = null;

		this._negotiator = new Negotiator(this);
		
		// 如果是仅数据连接,则不需要等待本地流
		if (options.dataOnly) {
			this._negotiator.startConnection({
				originator: true,
				dataOnly: true
			});
		} else if (this._localStream) {
			this._negotiator.startConnection({
				_stream: this._localStream,
				originator: true,
			});
		}
	}

	// /** Called by the Negotiator when the DataChannel is ready. */
	// override _initializeDataChannel(dc: RTCDataChannel): void {
	// 	this.dataChannel = dc;

	// 	this.dataChannel.onopen = () => {
	// 		log.debug(`DC#${this.connectionId} dc connection success`);
	// 		this.emit("willCloseOnRemote");
	// 	};

	// 	this.dataChannel.onclose = () => {
	// 		log.debug(`DC#${this.connectionId} dc closed for:`, this.peer);
	// 		this.close();
	// 	};
	// }

	onSignaling(callback: (type: SignalingType, data: any) => void): void {
		this.provider.on(`${this._peerId}:signaling`, (data) => {
			callback(data.type, data.payload);
		});
	}
	
	private _sendSignalQueue(): void {
		this.provider.mqttSignaling(this._peerId, this._signalQueue);
		this._signalQueue = [];
		if (this._signalQueueTimer) {
			clearTimeout(this._signalQueueTimer);
			this._signalQueueTimer = null;
		}
	}

	signaling(type: SignalingType, data: any, options?: any): void {
		// log.debug("Signaling", type, data);
		this._signalQueue.push({ type: type, payload: data });

		if (options?.inmediate || this._signalQueue.length > 10) {
			this._sendSignalQueue();

		} else {
			if (this._signalQueueTimer) {
				clearTimeout(this._signalQueueTimer);
			}
			this._signalQueueTimer = setTimeout(() => {
				this._sendSignalQueue();
			}, this._signalQueueDelay);
		}
	}

	addStream(remoteStream: MediaStream): void {
		log.debug("Receiving stream", remoteStream);
		this._remoteStream = remoteStream;
		super.emit("stream", remoteStream); // Should we call this `open`?
	}

	// /**
	//  * @internal
	//  */
	// handleMessage(message: ServerMessage): void {
	// 	const type = message.type;
	// 	const payload = message.payload;

	// 	switch (message.type) {
	// 		case ServerMessageType.Answer:
	// 			// Forward to negotiator
	// 			void this._negotiator.handleSDP(type, payload.sdp);
	// 			this._open = true;
	// 			break;
	// 		case ServerMessageType.Candidate:
	// 			void this._negotiator.handleCandidate(payload.candidate);
	// 			break;
	// 		default:
	// 			logger.warn(`Unrecognized message type:${type} from peer:${this.peer}`);
	// 			break;
	// 	}
	// }

	/**
     * When receiving a {@apilink PeerEvents | `call`} event on a peer, you can call
     * `answer` on the media connection provided by the callback to accept the call
     * and optionally send your own media stream.

     *
     * @param stream A WebRTC media stream.
     * @param options
     * @returns
     */
	answer(stream?: MediaStream, options: AnswerOption = {}): void {
		if (!this._negotiator) {
			log.error("Negotiator does not exist for connection");
			return;
		}

		this._localStream = stream || this._localStream;

		if (options && options.sdpTransform) {
			this.options.sdpTransform = options.sdpTransform;
		}

		this._negotiator.startConnection({
			...this.options._payload,
			_stream: stream,
		});

		// // Retrieve lost messages stored because PeerConnection not set up.
		// const messages = this.provider._getMessages(this.connectionId);

		// for (const message of messages) {
		// 	this.handleMessage(message);
		// }

		// this._open = true;
	}

	/**
	 * Exposed functionality for users.
	 */

	/**
	 * Closes the media connection.
	 */
	close(): void {
		if (this._negotiator) {
			this._negotiator.cleanup();
			this._negotiator = null;
		}

		this._localStream = null;
		this._remoteStream = null;

		// if (this.provider) {
		// 	this.provider._removeConnection(this);

		// 	this.provider = null;
		// }

		if (this.options && this.options._stream) {
			this.options._stream = null;
		}

		// if (!this.open) {
		// 	return;
		// }

		// this._open = false;

		super.emit("close");
	}
}
