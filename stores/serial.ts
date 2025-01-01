import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { SerialConfig, QuickCommand, LogConfig, TimedCommand } from '~/types/serial'

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
    showTimestamp: localStorage.getItem('serialLogShowTimestamp') === 'true' ? true : false
  })

  // 监听 showTimestamp 变化并保存到 localStorage
  watch(() => logConfig.value.showTimestamp, (newValue) => {
    localStorage.setItem('serialLogShowTimestamp', newValue.toString())
  })

  const quickCommands = ref<QuickCommand[]>(
    JSON.parse(localStorage.getItem('serialQuickCommands') || '[]')
  )

  // 监听 quickCommands 变化并保存到 localStorage
  watch(() => quickCommands.value, (newCommands) => {
    localStorage.setItem('serialQuickCommands', JSON.stringify(newCommands))
  }, { deep: true })

  const error = ref<string | null>(null)

  const timedCommands = ref<TimedCommand[]>(
    JSON.parse(localStorage.getItem('serialTimedCommands') || '[]')
  )
  
  const timerIds = new Map<string, NodeJS.Timeout>()

  // 监听 timedCommands 变化并保存到 localStorage
  watch(() => timedCommands.value, (newCommands) => {
    localStorage.setItem('serialTimedCommands', JSON.stringify(newCommands))
  }, { deep: true })

  async function handleConnect() {
    error.value = null
    try {
      // 先停止所有定时任务
      timedCommands.value.forEach(cmd => {
        if (cmd.isActive) {
          stopTimedCommand(cmd.id)
        }
        // 确保所有任务的状态都是停止的
        cmd.isActive = false
      })

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
      // 停止所有定时任务
      timedCommands.value.forEach(cmd => {
        if (cmd.isActive) {
          stopTimedCommand(cmd.id)
        }
        // 确保所有任务的状态都是停止的
        cmd.isActive = false
      })
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

  function updateQuickCommand(command: QuickCommand) {
    const index = quickCommands.value.findIndex(cmd => cmd.id === command.id)
    if (index !== -1) {
      quickCommands.value[index] = command
    }
  }

  function addTimedCommand(command: TimedCommand) {
    timedCommands.value.push(command)
  }

  function removeTimedCommand(id: string) {
    stopTimedCommand(id)
    timedCommands.value = timedCommands.value.filter(cmd => cmd.id !== id)
  }

  function startTimedCommand(id: string) {
    const command = timedCommands.value.find(cmd => cmd.id === id)
    if (!command) return

    const quickCommand = quickCommands.value.find(cmd => cmd.id === command.quickCommandId)
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
    const command = timedCommands.value.find(cmd => cmd.id === id)
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
    updateQuickCommand,
    error,
    timedCommands,
    addTimedCommand,
    removeTimedCommand,
    startTimedCommand,
    stopTimedCommand,
  }
})