export function convertFormat(data: string, fromFormat: string, toFormat: string): string {
  if (fromFormat === toFormat) return data;

  let bytes: number[];
  
  // Convert input to bytes
  switch (fromFormat) {
    case 'HEX':
      bytes = data.split(' ').map(hex => parseInt(hex, 16));
      break;
    case 'ASCII':
      bytes = data.split('').map(char => char.charCodeAt(0));
      break;
    case 'UTF-8':
      bytes = new TextEncoder().encode(data);
      break;
    default:
      throw new Error('Unsupported format');
  }

  // Convert bytes to output format
  switch (toFormat) {
    case 'HEX':
      return bytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    case 'ASCII':
      return bytes.map(byte => String.fromCharCode(byte)).join('');
    case 'UTF-8':
      return new TextDecoder().decode(new Uint8Array(bytes));
    default:
      throw new Error('Unsupported format');
  }
}

export function validateHexString(input: string): boolean {
  return /^[0-9A-Fa-f\s]*$/.test(input);
}

export const BAUD_RATES = [
  300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200
];