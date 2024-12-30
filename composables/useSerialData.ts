import { ref } from 'vue'
import type { SerialMessage } from '~/types/serial'

export function useSerialData() {
  const messages = ref<SerialMessage[]>([])
  const reader = ref<ReadableStreamDefaultReader | null>(null)
  const writer = ref<WritableStreamDefaultWriter | null>(null)

  async function startReading(port: SerialPort) {
    try {
      // 初始化 writer
      if (writer.value) {
        await writer.value.close()
        await writer.value.releaseLock()
      }
      writer.value = port.writable?.getWriter()
      if (!writer.value) {
        throw new Error('Failed to get serial writer')
      }

      // Release existing reader if any
      if (reader.value) {
        await reader.value.cancel()
        await reader.value.releaseLock()
        reader.value = null
      }

      // Get new reader
      reader.value = port.readable?.getReader()
      if (!reader.value) {
        throw new Error('Failed to get serial reader')
      }

      while (true) {
        try {
          const { value, done } = await reader.value.read()
          if (done) {
            console.log('Reading completed')
            break
          }

          if (value) {
            // console.log('Received data:', value)
            const message: SerialMessage = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              data: new TextDecoder().decode(value),
              direction: 'received',
              format: 'ASCII'
            }
            messages.value.push(message)
          }
        } catch (error) {
          console.error('Error reading data:', error)
          break
        }
      }
    } catch (error) {
      console.error('Failed to start reading:', error)
      throw error
    }
  }

  async function stopReading() {
    if (reader.value) {
      try {
        await reader.value.cancel()
        await reader.value.releaseLock()
        reader.value = null
      } catch (e) {
        console.error('Failed to stop reading:', e)
      }
    }

    if (writer.value) {
      try {
        await writer.value.close()
        await writer.value.releaseLock()
        writer.value = null
      } catch (e) {
        console.error('Failed to release writer:', e)
      }
    }
  }

  async function sendData(data: string, format: 'ASCII' | 'HEX' = 'ASCII') {
    if (!writer.value) return

    try {
      const encoder = new TextEncoder()
      const bytes = format === 'HEX' 
        ? new Uint8Array(data.split(' ').map(x => parseInt(x, 16)))
        : encoder.encode(data)

      await writer.value.write(bytes)

      messages.value.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        data,
        direction: 'sent',
        format
      })
    } catch (error) {
      console.error('Failed to send data:', error)
      throw error
    }
  }

  function clearMessages() {
    messages.value = []
  }

  return {
    messages,
    startReading,
    stopReading,
    sendData,
    clearMessages
  }
}