import { ref } from 'vue';
import type { SerialMessage } from '~/types/serial';

export function useSerialReader() {
  const messages = ref<SerialMessage[]>([]);

  async function startReading(reader: ReadableStreamDefaultReader) {
    while (true) {
      try {
        const { value, done } = await reader.read();
        if (done) break;
        
        const message: SerialMessage = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          data: new TextDecoder().decode(value),
          direction: 'received',
          format: 'UTF-8'
        };
        
        messages.value.push(message);
      } catch (error) {
        console.error('Reading failed:', error);
        break;
      }
    }
  }

  return {
    messages,
    startReading
  };
}