import { ref } from 'vue'
import type { SerialMessage } from '~/types/serial'
import { serialDB } from '~/utils/db'

export function useSerialData() {
  const messages = ref<SerialMessage[]>([])
  const reader = ref<ReadableStreamDefaultReader | null>(null)
  const writer = ref<WritableStreamDefaultWriter | null>(null)
  const messageBuffer = ref<string[]>([])
  const currentLogId = ref<number | null>(null)
  let saveTimeout: NodeJS.Timeout | null = null
  let partialLine = ''

  async function initializeNewLog() {
    const now = new Date()
    const name = `Serial Log ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
    currentLogId.value = await serialDB.saveLogFile({
      name,
      content: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }) as number
  }

  async function saveBufferToDb() {
    if (!currentLogId.value || messageBuffer.value.length === 0) return
    
    const file = await serialDB.getLogFile(currentLogId.value)
    if (!file) return

    await serialDB.updateLogFile(currentLogId.value, [
      ...file.content,
      ...messageBuffer.value
    ])
    
    messageBuffer.value = []
  }

  function scheduleBufferSave() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveBufferToDb, 35000) // 35 秒自动保存
  }

  function processReceivedData(data: string) {
    const lines: string[] = []
    let text = partialLine + data
    
    // 处理不同类型的换行符
    const matches = text.split(/\r\n|\n|\r/)
    
    // 保存最后一个不完整的行
    partialLine = matches[matches.length - 1]
    
    // 处理完整的行
    for (let i = 0; i < matches.length - 1; i++) {
      if (matches[i]) {
        lines.push(matches[i])
      }
    }

    return lines
  }

  async function startReading(port: SerialPort) {
    try {
      await initializeNewLog()
      partialLine = '' // 重置部分行缓存

      if (writer.value) {
        await writer.value.close()
        await writer.value.releaseLock()
      }
      writer.value = port.writable?.getWriter()
      if (!writer.value) {
        throw new Error('Failed to get serial writer')
      }

      if (reader.value) {
        await reader.value.cancel()
        await reader.value.releaseLock()
        reader.value = null
      }

      reader.value = port.readable?.getReader()
      if (!reader.value) {
        throw new Error('Failed to get serial reader')
      }

      while (true) {
        try {
          const { value, done } = await reader.value.read()
          if (done) break

          if (value) {
            const decodedData = new TextDecoder().decode(value)
            const message: SerialMessage = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              data: decodedData,
              direction: 'received',
              format: 'ASCII'
            }
            messages.value.push(message)
            
            // 处理数据保存，按行分割
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

    // 保存最后一个不完整的行（如果有）
    if (partialLine) {
      messageBuffer.value.push(partialLine)
      partialLine = ''
    }

    // 保存剩余数据
    if (messageBuffer.value.length > 0) {
      await saveBufferToDb()
    }
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    currentLogId.value = null
  }

  async function sendData(data: string, format: 'ASCII' | 'HEX' = 'ASCII') {
    if (!writer.value) return

    try {
      const encoder = new TextEncoder()
      const bytes = format === 'HEX' 
        ? new Uint8Array(data.split(' ').map(x => parseInt(x, 16)))
        : encoder.encode(data)

      await writer.value.write(bytes)

      const message: SerialMessage = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        data,
        direction: 'sent',
        format
      }
      messages.value.push(message)

      // 同时保存发送的数据到日志
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