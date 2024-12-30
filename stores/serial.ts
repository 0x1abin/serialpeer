import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SerialConfig, QuickCommand, LogConfig } from '~/types/serial'

export const useSerialStore = defineStore('serial', () => {
  const { port, isConnected, connect, disconnect } = useSerialPort()
  const { messages, startReading, stopReading, sendData, clearMessages } = useSerialData()

  const config = ref<SerialConfig>({
    portId: '',
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
  })

  const logConfig = ref<LogConfig>({
    maxSize: 1000,
    autoScroll: true,
    showTimestamp: true
  })

  const quickCommands = ref<QuickCommand[]>([])

  const error = ref<string | null>(null)

  async function handleConnect() {
    error.value = null
    try {
      const serialPort = await connect(config.value)
      if (!serialPort) {
        throw new Error('Failed to connect to serial port')
      }
      await startReading(serialPort)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Connection failed'
      throw err
    }
  }

  async function handleDisconnect() {
    try {
      await stopReading()
      await disconnect()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Disconnection failed'
      throw err
    }
  }

  function addQuickCommand(command: QuickCommand) {
    quickCommands.value.push(command)
  }

  function removeQuickCommand(id: string) {
    quickCommands.value = quickCommands.value.filter(cmd => cmd.id !== id)
  }

  return {
    config,
    logConfig,
    quickCommands,
    isConnected,
    messages,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sendData,
    clearMessages,
    addQuickCommand,
    removeQuickCommand,
    error
  }
})