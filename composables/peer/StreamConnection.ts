// StreamConnection.ts

import { EventEmitter } from "eventemitter3"
import { decodeMultiStream, Encoder } from "@msgpack/msgpack";

export class StreamConnection extends EventEmitter {
	private _CHUNK_SIZE = 1024 * 8 * 4;
	protected readonly MAX_BUFFERED_AMOUNT = 8 * 1024 * 1024;
	private _encoder = new Encoder();
	dataChannel: RTCDataChannel;

	private _splitStream = new TransformStream<Uint8Array>({
		transform: (chunk, controller) => {
			for (let split = 0; split < chunk.length; split += this._CHUNK_SIZE) {
				controller.enqueue(chunk.subarray(split, split + this._CHUNK_SIZE));
			}
		},
	});

	private _rawSendStream = new WritableStream<ArrayBuffer>({
		write: async (chunk, controller) => {
			const openEvent = new Promise((resolve) =>
				this.dataChannel.addEventListener("bufferedamountlow", resolve, {
					once: true,
				}),
			);

			// if we can send the chunk now, send it
			// if not, we wait until at least half of the sending buffer is free again
			await (this.dataChannel.bufferedAmount <=
				this.MAX_BUFFERED_AMOUNT - chunk.byteLength || openEvent);

			// TODO: what can go wrong here?
			try {
				// console.log("Send chunk", chunk.byteLength);
				this.dataChannel.send(chunk);
			} catch (e) {
				console.error(`DC#:${this.dataChannel.id} Error when sending:`, e);
				controller.error(e);
				this.dataChannel.close();
			}
		},
	});

	protected writer = this._splitStream.writable.getWriter();

	public send(data: any) {
		return this.writer.write(this._encoder.encode(data));
	}

	protected _rawReadStream = new ReadableStream<ArrayBuffer>({
		start: (controller) => {
			this.once("open", () => {
				this.dataChannel.addEventListener("message", (e) => {
					// console.log("Recv chunk", e.data.byteLength);
					controller.enqueue(e.data);
				});
			});
		},
	});

	constructor(dataChannel: RTCDataChannel) {
		super();
		this.dataChannel = dataChannel;
		void this._splitStream.readable.pipeTo(this._rawSendStream);

		(async () => {
			for await (const msg of decodeMultiStream(this._rawReadStream)) {
				// @ts-ignore
				// if (msg.__peerData?.type === "close") {
				// 	this.dataChannel.close();
				// 	return;
				// }
				this.emit("data", msg);
			}
		})();

		this.initializeDataChannel();
	}

	private initializeDataChannel() {
		this.dataChannel.binaryType = "arraybuffer";
		this.dataChannel.bufferedAmountLowThreshold = this.MAX_BUFFERED_AMOUNT / 2;
		this.dataChannel.addEventListener("open", () => {
			this.emit("open");
		});
		this.dataChannel.addEventListener("close", () => {
			this.emit("close");
		});
	}

	public close() {
		this.writer.close();
		this.dataChannel?.close();
	}
}
