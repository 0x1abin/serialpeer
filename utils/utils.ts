export function hexToUint8Array(hexString: string): Uint8Array {
  const hex = hexString.replace(/\s/g, '')
  return new Uint8Array(
    hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  )
}

export function formatHexInput(input: string): string {
  // Remove all spaces and invalid characters
  const cleanHex = input.replace(/[^0-9A-Fa-f]/g, '')
  // Add a space every two characters
  return cleanHex.replace(/.{2}/g, '$& ').trim()
}

export function validateAndFormatHex(hexString: string): string {
  // Remove whitespace
  let cleanHex = hexString.replace(/\s/g, '')
  
  // Validate HEX format
  if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
    throw new Error('Invalid HEX format')
  }
  
  // Add leading zero if odd number of characters
  if (cleanHex.length % 2 !== 0) {
    cleanHex = '0' + cleanHex
  }
  
  return cleanHex
}