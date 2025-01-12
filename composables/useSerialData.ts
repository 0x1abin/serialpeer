import { serialDB } from '~/utils/db'

export interface SerialMessage {
  id: string;
  timestamp: number;
  data: string;
  direction: 'received' | 'sent';
  format: 'HEX' | 'ASCII' | 'RAW';
}

export function useSerialData() {
  // Reactive variables
  const reader = ref<ReadableStreamDefaultReader | null>(null)
  const writer = ref<WritableStreamDefaultWriter | null>(null)
  const messageBuffer = ref<string[]>([])
  const currentLogId = ref<number | null>(null)
  const isLogRecording = ref(false)
  const onData = ref<((data: string) => void) | null>(null)

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
  async function startReading(port: any) {
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
          onData.value?.(decodedData)

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
    startReading,
    stopReading,
    sendData,
    startLogRecording,
    stopLogRecording,
    isLogRecording,
    onData,
  }
}