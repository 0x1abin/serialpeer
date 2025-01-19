// overMQTT.ts

import { EventEmitter } from "eventemitter3";
import mqtt from "mqtt";
import type { MqttClient, IClientOptions } from "mqtt";
import { Buffer } from 'buffer';
import { Decoder, Encoder } from "~/composables/jsonpack";
// import { Decoder, Encoder } from "@msgpack/msgpack";
// import { ServerMessageType, MQTTEventType } from "./enums";
// import { version } from "../package.json";

export enum MQTTEventType {
	Message = "message",
	Disconnected = "disconnected",
	Error = "error",
	Open = "open",
	Close = "close",
}

const log = new Logger('MQTT');
const version = "0.0.1";

/**
 * An abstraction on top of WebSockets to provide fastest
 * possible connection for peers.
 */
export class OverMQTT extends EventEmitter {
	private _disconnected: boolean = true;
	private _subscribed: boolean = false;
	private _peerId: string;
	private _messagesQueue: any[] = [];
	private _mqtt: MqttClient | undefined;
	private _mqttOptions: IClientOptions;
	private _secret: string | undefined;
	private _encoder = new Encoder();
	private _decoder = new Decoder();
	private _cryptoKey: CryptoKey | undefined;

	constructor(
		peerId: string,
		options: IClientOptions,
		securityKey?: string
	) {
		super();
		this._peerId = peerId;
		this._mqttOptions = options;
		if (securityKey) {
			const key = new TextEncoder().encode(securityKey);
			crypto.subtle.importKey(
				"raw",
				key,
				{ name: "AES-GCM" },
				false,
				["encrypt", "decrypt"]
			).then((key) => {
				this._cryptoKey = key;
				console.log("CryptoKey:", key);
			});
		}
	}

	private async _encrypt(data: Uint8Array): Promise<Uint8Array | null> {
		if (!this._cryptoKey || !data) {
			return null;
		}
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const encrypted = crypto.subtle.encrypt({
			name: "AES-GCM",
			iv: iv,
		}, this._cryptoKey, data );
		// iv + encrypted
		return new Uint8Array([...iv, ...new Uint8Array(await encrypted)]);
	}

	private async _decrypt(data: Uint8Array): Promise<Uint8Array | null> {
		if (!this._cryptoKey || !data) {
			return null;
		}
		const iv = data.slice(0, 12);
		const decrypted = crypto.subtle.decrypt({
			name: "AES-GCM",
			iv: iv,
		}, this._cryptoKey, data.slice(12));
		return new Uint8Array(await decrypted);
	}

	start(peerId?: string, secret?: string): boolean {
		if (!this._disconnected || this._mqtt) {
			log.error("Already connected");
			return false;
		}

		this._peerId = peerId || this._peerId;
		this._secret = secret || this._secret;
		const options: IClientOptions = {
			keepalive: 60,
			clientId: "uipcat@" + version + "-" + this._peerId.slice(0, 8),
			protocolId: 'MQTT',
			protocolVersion: 4,
			clean: true,
			connectTimeout: 1000 * 32,
			reconnectPeriod: 1000 * 30,
			...this._mqttOptions,
		};
		log.debug("IClientOptions:", options);
		this._mqtt = mqtt.connect(options);

		this._mqtt.on('connect', () => {
			log.debug("Connected");
			this._disconnected = false;
			this._mqtt!.subscribe(this._peerId, (err: any) => {
				if (err) {
					log.error("subscribe error:", err);
					this.emit(MQTTEventType.Error, err);
					return;
				}
				log.debug("Subscribed:", this._peerId);
				this._subscribed = true;
				this._sendQueuedMessages();
				this.emit(MQTTEventType.Open);
			});
		});

		this._mqtt.on('message', (topic, message) => {
			// message is Buffer
			// log.debug("mqtt Recv topic:", topic, `message[${message.length}]:`, message);
			try {
				if (topic === this._peerId) {
					const uint8Array = new Uint8Array(message.buffer, message.byteOffset, message.byteLength);
					if (this._cryptoKey) {
						this._decrypt(uint8Array).then((decrypted) => {
							if (decrypted) {
								const decoded = this._decoder.decode(decrypted);
								// log.debug("mqtt Recv topic:", topic, `message[${decrypted.length}]:`, decoded);
								this.emit(MQTTEventType.Message, decoded);
							}
						}).catch((error) => {
							log.error("Message decrypt:", error);
							this.emit(MQTTEventType.Error, error);
						});
					} else {
						const decoded = this._decoder.decode(uint8Array);
						// log.debug("mqtt Recv topic:", topic, `message[${uint8Array.length}]:`, decoded);
						this.emit(MQTTEventType.Message, decoded);
					}
				} else {
					this.emit(`topic:${topic}`, message);
				}
			} catch (error) {
				log.error("Error on message:", error);
				this.emit(MQTTEventType.Error, error);
			}
		});

		this._mqtt.on('disconnect', () => {
			log.warn("MQTT on disconnected.");
			this._subscribed = false;
			this._disconnected = true;
			this.emit(MQTTEventType.Disconnected);
		});

		this._mqtt.on('close', () => {
			log.debug("MQTT on closed.");
			this.emit(MQTTEventType.Close );
		});

		this._mqtt.on('error', (err: any) => {
			log.debug("MQTT on error:", err);
			this.emit(MQTTEventType.Error, err);
		});

		this._mqtt.on('reconnect', () => {
			log.debug("MQTT on reconnecting...");
		});

		this._mqtt.on('offline', () => {
			log.debug("MQTT on offline.");
		});

		this._mqtt.on('end', () => {
			log.debug("MQTT on end.");
		});

		return true;
	}

	/** Send queued messages. */
	private _sendQueuedMessages(): void {
		//Create copy of queue and clear it,
		//because send method push the message back to queue if smth will go wrong
		const copiedQueue = [...this._messagesQueue];
		this._messagesQueue = [];
		copiedQueue.forEach((message) => {
			this._mqtt!.publish(message.topic, message.meassge);
		});
	}

	send(peerId: string, meassge: any): void {
		// log.debug("mqtt Publish to:", peerId, `message[${JSON.stringify(meassge).length}]:`, meassge);
		const encoded = this._encoder.encode(meassge);
		if (this._cryptoKey) {
			this._encrypt(encoded).then((encrypted) => {
				if (encrypted) {
					this.publish(peerId, Buffer.from(encrypted));
				}
			});
		} else {
			this.publish(peerId, Buffer.from(encoded));
		}
	}

	close(): void {
		if (this._disconnected) {
			return;
		}
		this._disconnected = true;
		this._cleanup();
	}

	private _cleanup(): void {
		if (this._mqtt) {
			this._mqtt.end();
			this._mqtt = undefined;
		}
	}

	publish(topic: string, message: any): void {
		if (!this._mqtt || this._disconnected || !this._subscribed) {
			this._messagesQueue.push({topic: topic, meassge: message});
			return;
		}
		// log.debug("mqtt Publish to:", topic, `message[${message.length}]:`, message);
		this._mqtt.publish(topic, message);
	}

	subscribe(topic: string, onMessage: (message: any) => void): void {
		if (!this._mqtt || this._disconnected) {
			return;
		}
		this._mqtt.subscribe(topic);
		log.debug("Subscribed:", topic);
		this.on(`topic:${topic}`, onMessage);
	}

	unsubscribe(topic: string): void {
		if (!this._mqtt || this._disconnected) {
			return;
		}
		this._mqtt.unsubscribe(topic);
		this.off(`topic:${topic}`);
	}
}