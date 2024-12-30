import { ref } from 'vue';
import type { SerialConfig } from '~/types/serial';

export function useSerialConnection() {
  const port = ref<SerialPort | null>(null);
  const reader = ref<ReadableStreamDefaultReader | null>(null);
  const writer = ref<WritableStreamDefaultWriter | null>(null);
  const isConnected = ref(false);

  async function connect(config: SerialConfig) {
    try {
      const newPort = await navigator.serial.requestPort();
      await newPort.open(config);
      
      port.value = newPort;
      reader.value = port.value.readable?.getReader();
      writer.value = port.value.writable?.getWriter();
      isConnected.value = true;
      
      return { reader: reader.value, writer: writer.value };
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  async function disconnect() {
    try {
      await reader.value?.cancel();
      await reader.value?.releaseLock();
      await writer.value?.releaseLock();
      await port.value?.close();
      
      port.value = null;
      reader.value = null;
      writer.value = null;
      isConnected.value = false;
    } catch (error) {
      console.error('Disconnection failed:', error);
      throw error;
    }
  }

  return {
    isConnected,
    connect,
    disconnect
  };
}