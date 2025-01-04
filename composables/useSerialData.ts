import { ref } from 'vue'
import type { SerialMessage } from '~/types/serial'
import { serialDB } from '~/utils/db'

export function useSerialData() {
  // Reactive variables
  const messages = ref<SerialMessage[]>([])
  const reader = ref<ReadableStreamDefaultReader | null>(null)
  const writer = ref<WritableStreamDefaultWriter | null>(null)
  const messageBuffer = ref<string[]>([])
  const currentLogId = ref<number | null>(null)
  const isLogRecording = ref(false)

  let saveTimeout: NodeJS.Timeout | null = null
  let partialLine = ''

  /**
   * Initialize a new log file in the database
   */
  async function initializeNewLog() {
    currentLogId.value = await serialDB.saveLogFile({
      content: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }) as number
  }

  /**
   * Save buffered messages to the database
   */
  async function saveBufferToDb() {
    if (!currentLogId.value || messageBuffer.value.length === 0) return

    const file = await serialDB.getLogFile(currentLogId.value)
    if (!file) return

    await serialDB.updateLogFile(currentLogId.value, [
      ...file.content,
      ...messageBuffer.value,
    ])

    messageBuffer.value = []
  }

  /**
   * Schedule buffer saving to avoid frequent writes
   */
  function scheduleBufferSave() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveBufferToDb, 35000) // Save every 35 seconds
  }

  /**
   * Process received data and handle partial lines
   * @param data - Incoming data as string
   */
  function processReceivedData(data: string) {
    const lines: string[] = []
    const text = partialLine + data

    const matches = text.split(/\r\n|\n|\r/)
    partialLine = matches.pop() || ''

    if (isLogRecording.value) {
      lines.push(...matches.filter(line => line))
    }

    return lines
  }

  /**
   * Start reading data from the serial port
   * @param port - Serial port instance
   */
  async function startReading(port: SerialPort) {
    try {
      partialLine = '' // Reset partial line buffer

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
          const message: SerialMessage = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            data: decodedData,
            direction: 'received',
            format: 'ASCII',
          }
          messages.value.push(message)

          // Process and buffer received lines
          const lines = processReceivedData(decodedData)
          if (lines.length > 0) {
            messageBuffer.value.push(...lines)
            if (messageBuffer.value.length >= 30) {
              await saveBufferToDb()
            } else {
              scheduleBufferSave()
            }
          }
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

      // Save any remaining partial line
      if (partialLine) {
        messageBuffer.value.push(partialLine)
        partialLine = ''
      }

      // Save any buffered data
      if (messageBuffer.value.length > 0) {
        await saveBufferToDb()
      }
      if (saveTimeout) {
        clearTimeout(saveTimeout)
        saveTimeout = null
      }

      currentLogId.value = null
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
  async function sendData(data: string, format: 'ASCII' | 'HEX' = 'ASCII') {
    if (!writer.value) return

    try {
      let bytes: Uint8Array

      if (format === 'HEX') {
        bytes = new Uint8Array(data.split(' ').map(x => parseInt(x, 16)))
      } else {
        bytes = new TextEncoder().encode(data)
      }

      await writer.value.write(bytes)

      const message: SerialMessage = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        data,
        direction: 'sent',
        format,
      }
      messages.value.push(message)

      // Also log sent data
      if (currentLogId.value) {
        messageBuffer.value.push(`[Sent ${format}] ${data}`)
        if (messageBuffer.value.length >= 30) {
          await saveBufferToDb()
        } else {
          scheduleBufferSave()
        }
      }
    } catch (error) {
      console.error('Failed to send data:', error)
      throw error
    }
  }

  /**
   * Clear all messages
   */
  function clearMessages() {
    messages.value = []
  }

  /**
   * Start log recording
   */
  async function startLogRecording() {
    if (isLogRecording.value) return
    isLogRecording.value = true
    await initializeNewLog()
  }

  /**
   * Stop log recording
   */
  async function stopLogRecording() {
    if (!isLogRecording.value) return
    isLogRecording.value = false

    // Save any remaining partial line
    if (partialLine) {
      messageBuffer.value.push(partialLine)
      partialLine = ''
    }

    // Save any buffered data
    if (messageBuffer.value.length > 0) {
      await saveBufferToDb()
    }
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
    currentLogId.value = null
  }

  return {
    messages,
    startReading,
    stopReading,
    sendData,
    clearMessages,
    startLogRecording,
    stopLogRecording,
    isLogRecording,
  }
}