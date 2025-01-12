import { serialDB } from '~/utils/db'

export function useLogRecord() {
  const messageBuffer = ref<string[]>([])
  const currentLogId = ref<number | null>(null)
  const isLogRecording = ref(false)
  const store = useSerialStore()
  
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
   * Start log recording
   */
  async function startLogRecording() {
    if (isLogRecording.value) return
    isLogRecording.value = true

    store.addEventListener('data', handleData)

    await initializeNewLog()
  }

  /**
   * Stop log recording
   */
  async function stopLogRecording() {
    if (!isLogRecording.value) return
    isLogRecording.value = false

    store.removeEventListener('data', handleData)

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

    cleanup()
  }

  /**
   * Handle new received data
   */
  function handleData(event: SerialEvent) {
    if (event.key !== 'data') return
    const lines = processReceivedData(event.data)
    if (lines.length > 0) {
      messageBuffer.value.push(...lines)
      if (messageBuffer.value.length >= 30) {
        saveBufferToDb()
      } else {
        scheduleBufferSave()
      }
    }
  }

  /**
   * Clean up resources
   */
  async function cleanup() {
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
    isLogRecording,
    startLogRecording,
    stopLogRecording,
  }
}
