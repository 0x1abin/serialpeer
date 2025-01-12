import { defineStore } from 'pinia'
import { useSerialPort } from '~/composables/useSerialPort'
import type { SerialConfig } from '~/composables/useSerialPort'
import type { QuickCommand, TimedCommand } from '~/composables/interface'

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
    isLogRecording,
    startLogRecording,
    stopLogRecording,
    onData,
  } = useSerialData()

  // Reactive state
  const config = ref<SerialConfig>({
    portId: '',
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  })

  const logConfig = ref<LogConfig>({
    maxSize: 1000,
    autoScroll: true,
    showTimestamp: localStorage.getItem('serialLogShowTimestamp') === 'true',
  })

  // Watch logConfig changes and save to localStorage
  watch(
    () => logConfig.value.showTimestamp,
    (newValue) => {
      localStorage.setItem('serialLogShowTimestamp', newValue.toString())
    }
  )

  const quickCommands = ref<QuickCommand[]>(
    JSON.parse(localStorage.getItem('serialQuickCommands') || '[]')
  )

  // Watch quickCommands changes and save to localStorage
  watch(
    () => quickCommands.value,
    (newCommands) => {
      localStorage.setItem('serialQuickCommands', JSON.stringify(newCommands))
    },
    { deep: true }
  )

  const error = ref<string | null>(null)

  const timedCommands = ref<TimedCommand[]>(
    JSON.parse(localStorage.getItem('serialTimedCommands') || '[]')
  )

  const timerIds = new Map<string, NodeJS.Timeout>()

  // Watch timedCommands changes and save to localStorage
  watch(
    () => timedCommands.value,
    (newCommands) => {
      localStorage.setItem('serialTimedCommands', JSON.stringify(newCommands))
    },
    { deep: true }
  )

  /**
   * Handle serial port connection
   */
  async function handleConnect() {
    error.value = null
    try {
      // Stop all timed commands
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

  /**
   * Stop all timed commands
   */
  function stopAllTimedCommands() {
    timedCommands.value.forEach((cmd) => {
      if (cmd.isActive) {
        stopTimedCommand(cmd.id)
      }
      cmd.isActive = false
    })
  }

  /**
   * Quick command operations
   */
  function addQuickCommand(command: QuickCommand) {
    quickCommands.value.push(command)
  }

  function removeQuickCommand(id: string) {
    quickCommands.value = quickCommands.value.filter((cmd) => cmd.id !== id)
  }

  function updateQuickCommand(command: QuickCommand) {
    const index = quickCommands.value.findIndex((cmd) => cmd.id === command.id)
    if (index !== -1) {
      quickCommands.value[index] = command
    }
  }

  /**
   * Timed command operations
   */
  function addTimedCommand(command: TimedCommand) {
    timedCommands.value.push(command)
  }

  function removeTimedCommand(id: string) {
    stopTimedCommand(id)
    timedCommands.value = timedCommands.value.filter((cmd) => cmd.id !== id)
  }

  function startTimedCommand(id: string) {
    const command = timedCommands.value.find((cmd) => cmd.id === id)
    if (!command) return

    const quickCommand = quickCommands.value.find(
      (cmd) => cmd.id === command.quickCommandId
    )
    if (!quickCommand) return

    command.isActive = true

    const executeCommand = () => {
      let dataToSend = quickCommand.command
      if (quickCommand.addNewline && quickCommand.format === 'ASCII') {
        dataToSend += '\n'
      }
      sendData(dataToSend, quickCommand.format)
    }

    if (command.isLoop) {
      const timerId = setInterval(executeCommand, command.interval)
      timerIds.set(command.id, timerId)
    } else {
      const timerId = setTimeout(() => {
        executeCommand()
        stopTimedCommand(command.id)
      }, command.interval)
      timerIds.set(command.id, timerId)
    }
  }

  function stopTimedCommand(id: string) {
    const command = timedCommands.value.find((cmd) => cmd.id === id)
    if (!command) return

    const timerId = timerIds.get(command.id)
    if (timerId) {
      if (command.isLoop) {
        clearInterval(timerId)
      } else {
        clearTimeout(timerId)
      }
      timerIds.delete(command.id)
    }
    command.isActive = false
  }

  function updateTimedCommand(command: TimedCommand) {
    const index = timedCommands.value.findIndex((cmd) => cmd.id === command.id)
    if (index !== -1) {
      // If the command was active, stop it first
      if (timedCommands.value[index].isActive) {
        stopTimedCommand(command.id)
      }
      // Update the command
      timedCommands.value[index] = command
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
    logConfig,
    quickCommands,
    isConnected,
    onData,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sendData,
    addQuickCommand,
    removeQuickCommand,
    updateQuickCommand,
    error,
    timedCommands,
    addTimedCommand,
    removeTimedCommand,
    startTimedCommand,
    stopTimedCommand,
    updateTimedCommand,
    isLogRecording,
    startLogRecording,
    stopLogRecording,
    addEventListener,
    removeEventListener
  }
})