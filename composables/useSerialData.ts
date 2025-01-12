export interface SerialMessage {
  id: string;
  timestamp: number;
  data: string;
  direction: 'received' | 'sent';
  format: 'HEX' | 'ASCII' | 'RAW';
}

export function useSerialData() {
  const reader = ref<ReadableStreamDefaultReader | null>(null)
  const writer = ref<WritableStreamDefaultWriter | null>(null)
  const onData = ref<((data: string) => void) | null>(null)

  /**
   * Initialize a new log file in the database
   */
  async function startReading(port: any) {
    try {
      // Close existing writer if any
      if (writer.value) {
        await writer.value.close()
        writer.value.releaseLock()
        writer.value = null
      }

      // Get new writer
      writer.value = port.writable?.getWriter()
      if (!writer.value) throw new Error('Failed to get serial writer')

      // Cancel existing reader if any
      if (reader.value) {
        await reader.value.cancel()
        reader.value.releaseLock()
        reader.value = null
      }

      // Get new reader
      reader.value = port.readable?.getReader()
      if (!reader.value) throw new Error('Failed to get serial reader')

      while (true) {
        const { value, done } = await reader.value.read()
        if (done) break

        if (value) {
          const decodedData = new TextDecoder().decode(value)
          onData.value?.(decodedData)
        }
      }
    } catch (error) {
      console.error('Failed to start reading:', error)
      throw error
    }
  }

  /**
   * Stop reading data and clean up resources
   */
  async function stopReading() {
    try {
      if (reader.value) {
        await reader.value.cancel()
        reader.value.releaseLock()
        reader.value = null
      }

      if (writer.value) {
        await writer.value.close()
        writer.value.releaseLock()
        writer.value = null
      }
    } catch (error) {
      console.error('Failed to stop reading:', error)
      throw error
    }
  }

  /**
   * Send data to the serial port
   * @param data - Data to send
   * @param format - Data format ('ASCII' or 'HEX')
   */
  async function sendData(data: Uint8Array | string, format: 'ASCII' | 'HEX' | 'RAW' = 'ASCII') {
    if (!writer.value) return

    try {
      if (format === 'RAW') {
        return await writer.value.write(data)
      } else if (format === 'ASCII' && typeof data === 'string') {
        const bytes = new TextEncoder().encode(data)
        return await writer.value.write(bytes)
      } else if (format === 'HEX' && typeof data === 'string') {
        const bytes = new Uint8Array(data.split(' ').map(x => parseInt(x, 16)))
        return await writer.value.write(bytes)
      }
    } catch (error) {
      console.error('Failed to send data:', error)
      throw error
    }
  }

  return {
    startReading,
    stopReading,
    sendData,
    onData,
  }
}