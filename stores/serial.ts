import { defineStore } from 'pinia'
import { useSerialPort } from '~/composables/useSerialPort'
import type { SerialConfig } from '~/composables/useSerialPort'
import type { QuickCommand, TimedCommand } from '~/composables/interface'
import { useSerialData } from '~/composables/useSerialData'
import { useLogRecord } from '~/composables/useLogRecord'
import { useCommand } from '~/composables/useCommand'

export interface LogConfig {
  maxSize: number;
  autoScroll: boolean;
  showTimestamp: boolean;
}

export const useSerialStore = defineStore('serial', () => {
  const eventListeners = ref<{ [key: string]: ((event: SerialEvent) => void)[] }>({})

  const {
    isConnected,
    connect,
    disconnect
  } = useSerialPort()

  const {
    startReading,
    stopReading,
    sendData,
    onData,
  } = useSerialData()

  const {
    isLogRecording,
    startLogRecording,
    stopLogRecording,
  } = useLogRecord()

  const {
    quickCommands,
    timedCommands,
    addQuickCommand,
    removeQuickCommand,
    updateQuickCommand,
    sendQuickCommand,
    addTimedCommand,
    removeTimedCommand,
    startTimedCommand,
    stopTimedCommand,
    updateTimedCommand,
    stopAllTimedCommands
  } = useCommand()

  // Reactive state
  const config = ref<SerialConfig>({
    portId: '',
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  })

  const error = ref<string | null>(null)

  /**
   * Handle serial port connection
   */
  async function handleConnect() {
    error.value = null
    try {
      // 停止所有定时命令
      stopAllTimedCommands()

      const serialPort = await connect(config.value)
      if (!serialPort) {
        throw new Error('Failed to connect to serial port')
      }
      triggerEvent('connect', { port: serialPort })
      await startReading(serialPort)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Connection failed'
      throw err
    }
  }

  /**
   * Handle serial port disconnection
   */
  async function handleDisconnect() {
    try {
      // Stop log recording if active
      if (isLogRecording.value) {
        await stopLogRecording()
      }

      // Stop all timed commands
      stopAllTimedCommands()
      await stopReading()
      await disconnect()
      triggerEvent('disconnect', null)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Disconnection failed'
      throw err
    }
  }

  function addEventListener(event: string, callback: (e: SerialEvent) => void) {
    if (!eventListeners.value[event]) {
      eventListeners.value[event] = []
    }
    eventListeners.value[event].push(callback)
  }

  function removeEventListener(event: string, callback: (e: SerialEvent) => void) {
    if (eventListeners.value[event]) {
      eventListeners.value[event] = eventListeners.value[event].filter(cb => cb !== callback)
    }
  }

  function triggerEvent(event: string, data: any) {
    eventListeners.value[event]?.forEach(listener => listener({ key: event, data }))
  }

  onData.value = (data: string) => {
    triggerEvent('data', data)
  }

  return {
    config,
    quickCommands,
    timedCommands,
    isConnected,
    onData,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sendData,
    addQuickCommand,
    removeQuickCommand,
    updateQuickCommand,
    sendQuickCommand,
    error,
    addTimedCommand,
    removeTimedCommand,
    startTimedCommand,
    stopTimedCommand,
    updateTimedCommand,
    isLogRecording,
    startLogRecording,
    stopLogRecording,
    addEventListener,
    removeEventListener,
  }
})