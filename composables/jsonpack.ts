export class Encoder {
	encode(data: any): Uint8Array {
		return new TextEncoder().encode(JSON.stringify(data));
	}
}

export class Decoder {
	decode(data: Uint8Array): any {
		return JSON.parse(new TextDecoder().decode(data));
	}
}