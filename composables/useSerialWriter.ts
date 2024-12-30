import type { SerialMessage } from '~/types/serial';
import { convertFormat } from '~/utils/serial';

export function useSerialWriter() {
  async function sendData(
    writer: WritableStreamDefaultWriter,
    data: string,
    format: 'HEX' | 'ASCII' | 'UTF-8' = 'ASCII'
  ): Promise<SerialMessage> {
    try {
      const utf8Data = convertFormat(data, format, 'UTF-8');
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(utf8Data));

      return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        data,
        direction: 'sent',
        format
      };
    } catch (error) {
      console.error('Send failed:', error);
      throw error;
    }
  }

  return {
    sendData
  };
}