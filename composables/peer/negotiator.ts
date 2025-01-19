// negotiator.ts

import webRTCAdapter_import from "webrtc-adapter";
import type { MediaConnection } from "./mediaconnection";

const log = new Logger('negotiator');
log.logLevel = LogLevel.Info;

const webRTCAdapter: typeof webRTCAdapter_import =
	//@ts-ignore
	webRTCAdapter_import.default || webRTCAdapter_import;


export enum ConnectionType {
	Data = "data",
	Media = "media",
}

export enum BaseConnectionErrorType {
	NegotiationFailed = "negotiation-failed",
	ConnectionClosed = "connection-closed",
}

export enum DataConnectionErrorType {
	NotOpenYet = "not-open-yet",
	MessageToBig = "message-too-big",
}

export enum SignalingType {
	Heartbeat = "heartbeat",
	Candidate = "candidate",
	Offer = "offer",
	Answer = "answer",
	Open = "open",
	Error = "error",
	IdTaken = "id-taken",
	InvalidKey = "invalid-key",
	Leave = "leave",
	Expire = "expire",
}

/**
 * Manages all negotiations between Peers.
 */
export class Negotiator {
	connection: MediaConnection;

	constructor(connection: MediaConnection) {
		this.connection = connection;
	}

	/** Returns a PeerConnection object set up correctly (for data, media). */
	startConnection(options: any) {
		console.log('Negotiator.startConnection:', this.connection.options.config);
		const peerConnection = new RTCPeerConnection(
			this.connection.options.config,
		);

		this._setupListeners(peerConnection);

		this.connection.peerConnection = peerConnection;

		if (this.connection.type === ConnectionType.Media && 
			options._stream && 
			!options.dataOnly) {
			this._addTracksToConnection(options._stream, peerConnection);
		}

		const config: RTCDataChannelInit = { ordered: !!options.reliable };
		this.connection.dataChannel = peerConnection.createDataChannel('dc:uipc', config);

		this.connection.onSignaling((type: SignalingType, payload: any) => {
			switch (type) {
				case SignalingType.Answer:
					this.handleSDP("answer", payload.sdp);
					break;
				case SignalingType.Candidate:
					this.handleCandidate(payload.candidate);
					break;
			}
		});

		if (options.originator) {
			void this._makeOffer();
		} else {
			void this.handleSDP("offer", options.sdp);
		}
	}

	/** Set up various WebRTC listeners. */
	private _setupListeners(peerConnection: RTCPeerConnection) {
		const peerId = this.connection.peer;
		// const connectionId = this.connection.connectionId;
		// const connectionType = this.connection.type;
		// const provider = this.connection.provider;

		// ICE CANDIDATES.
		log.debug("Listening for ICE candidates.");

		peerConnection.onicecandidate = (evt) => {
			if (!evt.candidate || !evt.candidate.candidate) return;

			log.debug(`Local ICE candidates:`, evt.candidate);
			this.connection.signaling(SignalingType.Candidate, {
				candidate: JSON.parse(JSON.stringify(evt.candidate))
			});
		};

		peerConnection.oniceconnectionstatechange = () => {
			switch (peerConnection.iceConnectionState) {
				case "failed":
					log.debug(
						"iceConnectionState is failed, closing connections to " + peerId,
					);
					// this.connection.emitError(
					// 	BaseConnectionErrorType.NegotiationFailed,
					// 	"Negotiation of connection to " + peerId + " failed.",
					// );
					this.connection.close();
					break;
				case "closed":
					log.debug(
						"iceConnectionState is closed, closing connections to " + peerId,
					);
					// this.connection.emitError(
					// 	BaseConnectionErrorType.ConnectionClosed,
					// 	"Connection to " + peerId + " closed.",
					// );
					this.connection.close();
					break;
				case "disconnected":
					log.debug(
						"iceConnectionState changed to disconnected on the connection with " +
						peerId,
					);
					break;
				case "completed":
					peerConnection.onicecandidate = () => { };
					break;
			}

			this.connection.emit(
				"iceStateChanged",
				peerConnection.iceConnectionState,
			);
		};

		// // DATACONNECTION.
		// log.debug("Listening for data channel");
		// // Fired between offer and answer, so options should already be saved
		// // in the options hash.
		// peerConnection.ondatachannel = (evt) => {
		// 	log.debug("Received data channel");

		// 	// const dataChannel = evt.channel;
		// 	// const connection = <DataConnection>(
		// 	// 	provider.getConnection(peerId, connectionId)
		// 	// );

		// 	// connection._initializeDataChannel(dataChannel);
		// };

		// MEDIACONNECTION.
		log.debug("Listening for remote stream");

		peerConnection.ontrack = (evt) => {
			log.debug("Received remote stream");

			const stream = evt.streams[0];
			// const connection = provider.getConnection(peerId, connectionId);
			const connection = this.connection;

			if (connection.type === ConnectionType.Media) {
				const mediaConnection = <MediaConnection>connection;

				this._addStreamToMediaConnection(stream, mediaConnection);
			}
		};
	}

	cleanup(): void {
		log.debug("Cleaning up PeerConnection to " + this.connection.peer);

		const peerConnection = this.connection.peerConnection!;

		// this.connection.peerConnection = null;

		//unsubscribe from all PeerConnection's events
		peerConnection.onicecandidate =
			peerConnection.oniceconnectionstatechange =
			peerConnection.ondatachannel =
			peerConnection.ontrack =
			() => { };

		const peerConnectionNotClosed = peerConnection.signalingState !== "closed";
		let dataChannelNotClosed = false;

		// const dataChannel = this.connection.dataChannel;

		// if (dataChannel) {
		// 	dataChannelNotClosed =
		// 		!!dataChannel.readyState && dataChannel.readyState !== "closed";
		// }

		if (peerConnectionNotClosed || dataChannelNotClosed) {
			peerConnection.close();
		}
	}

	private async _makeOffer(): Promise<void> {
		const peerConnection = this.connection.peerConnection!;

		try {
			const offer = await peerConnection.createOffer(
				this.connection.options.constraints,
			);

			log.debug("Created offer.");

			// if (
			// 	this.connection.options.sdpTransform &&
			// 	typeof this.connection.options.sdpTransform === "function"
			// ) {
			// 	offer.sdp =
			// 		this.connection.options.sdpTransform(offer.sdp) || offer.sdp;
			// }

			try {
				await peerConnection.setLocalDescription(offer);

				log.debug(
					"Set localDescription:",
					offer,
					`for:${this.connection.peer}`,
				);

				const payload: any = {
					sdp: JSON.parse(JSON.stringify(offer)),
					type: this.connection.type,
					config: this.connection.options.config,
					// connectionId: this.connection.connectionId,
					// metadata: this.connection.metadata,
				};

				// if (this.connection.type === ConnectionType.Data) {
				// 	const dataConnection = <DataConnection>(<unknown>this.connection);

				// 	payload = {
				// 		...payload,
				// 		label: dataConnection.label,
				// 		reliable: dataConnection.reliable,
				// 		serialization: dataConnection.serialization,
				// 	};
				// }

				this.connection.signaling(SignalingType.Offer, payload, { inmediate: true });

			} catch (err) {
				// TODO: investigate why _makeOffer is being called from the answer
				if (
					err !=
					"OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer"
				) {
					// provider.emitError(PeerErrorType.WebRTC, err);
					log.debug("Failed to setLocalDescription, ", err);
				}
			}
		} catch (err_1) {
			// provider.emitError(PeerErrorType.WebRTC, err_1);
			log.debug("Failed to createOffer, ", err_1);
		}
	}

	private async _makeAnswer(): Promise<void> {
		const peerConnection = this.connection.peerConnection!;
		// const provider = this.connection.provider;

		try {
			const answer = await peerConnection.createAnswer();
			log.debug("Created answer.");

			// if (
			// 	this.connection.options.sdpTransform &&
			// 	typeof this.connection.options.sdpTransform === "function"
			// ) {
			// 	answer.sdp =
			// 		this.connection.options.sdpTransform(answer.sdp) || answer.sdp;
			// }

			try {
				await peerConnection.setLocalDescription(answer);

				log.debug(
					`Set localDescription:`,
					answer,
					`for:${this.connection.peer}`,
				);

				const payload = {
					sdp: JSON.parse(JSON.stringify(answer)),
					type: this.connection.type,
				}
				this.connection.signaling(SignalingType.Answer, payload, { inmediate: true });
			} catch (err) {
				// provider.emitError(PeerErrorType.WebRTC, err);
				log.error("Failed to setLocalDescription, ", err);
			}
		} catch (err_1) {
			// provider.emitError(PeerErrorType.WebRTC, err_1);
			log.error("Failed to create answer, ", err_1);
		}
	}

	/** Handle an SDP. */
	async handleSDP(type: string, sdp: any): Promise<void> {
		sdp = new RTCSessionDescription(sdp);
		const peerConnection = this.connection.peerConnection;
		// const provider = this.connection.provider;

		log.debug("Setting remote description", sdp);

		const self = this;

		try {
			await peerConnection!.setRemoteDescription(sdp);
			log.debug(`Set remoteDescription:${type} for:${this.connection.peer}`);
			if (type === "offer") {
				await self._makeAnswer();
			}
		} catch (err) {
			// provider.emitError(PeerErrorType.WebRTC, err);
			log.error("Failed to setRemoteDescription, ", err);
		}
	}

	/** Handle a candidate. */
	async handleCandidate(ice: RTCIceCandidate) {

		try {
			log.debug(`Remote ICE candidate:`, ice);
			await this.connection.peerConnection!.addIceCandidate(ice);
			// log.debug(`Added ICE candidate for:${this.connection.peer}`);
		} catch (err) {
			// this.connection.provider.emitError(PeerErrorType.WebRTC, err);
			log.error("Failed to handleCandidate, ", err);
		}
	}

	private _addTracksToConnection(
		stream: MediaStream,
		peerConnection: RTCPeerConnection,
	): void {
		log.debug(`add tracks from stream ${stream.id} to peer connection`);

		if (!peerConnection.addTrack) {
			return log.error(
				`Your browser does't support RTCPeerConnection#addTrack. Ignored.`,
			);
		}

		stream.getTracks().forEach((track) => {
			peerConnection.addTrack(track, stream);
		});
	}

	private _addStreamToMediaConnection(
		stream: MediaStream,
		mediaConnection: MediaConnection,
	): void {
		// log.debug(
		// 	`add stream ${stream.id} to media connection ${mediaConnection.connectionId}`,
		// );
		mediaConnection.addStream(stream);
	}
}
