import type { QuickCommand, TimedCommand } from './interface'

export function useCommand() {
  const store = useSerialStore()

  const quickCommands = ref<QuickCommand[]>(
    JSON.parse(localStorage.getItem('serialQuickCommands') || '[]')
  )

  const timedCommands = ref<TimedCommand[]>(
    JSON.parse(localStorage.getItem('serialTimedCommands') || '[]')
  )

  const timerIds = new Map<string, NodeJS.Timeout>()

  // 监听 quickCommands 变化并保存到 localStorage
  watch(
    () => quickCommands.value,
    (newCommands) => {
      localStorage.setItem('serialQuickCommands', JSON.stringify(newCommands))
    },
    { deep: true }
  )

  // 监听 timedCommands 变化并保存到 localStorage
  watch(
    () => timedCommands.value,
    (newCommands) => {
      localStorage.setItem('serialTimedCommands', JSON.stringify(newCommands))
    },
    { deep: true }
  )

  /**
   * Quick command 操作
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

  function sendQuickCommand(cmd: QuickCommand) {
    let dataToSend = cmd.command
    if (cmd.addNewline && cmd.format === 'ASCII') {
      dataToSend += '\r\n'
    }
    store.sendData(dataToSend, cmd.format)
  }

  function getQuickCommandById(id: string) {
    return quickCommands.value.find(cmd => cmd.id === id)
  }

  /**
   * Timed command 操作
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

    const quickCommand = getQuickCommandById(command.quickCommandId)
    if (!quickCommand) return

    command.isActive = true

    if (command.isLoop) {
      const timerId = setInterval(() => {
        sendQuickCommand(quickCommand)
      }, command.interval)
      timerIds.set(command.id, timerId)
    } else {
      const timerId = setTimeout(() => {
        sendQuickCommand(quickCommand)
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
      // 如果命令处于活动状态，先停止它
      if (timedCommands.value[index].isActive) {
        stopTimedCommand(command.id)
      }
      // 更新命令
      timedCommands.value[index] = command
    }
  }

  function stopAllTimedCommands() {
    timedCommands.value.forEach((cmd) => {
      if (cmd.isActive) {
        stopTimedCommand(cmd.id)
      }
      cmd.isActive = false
    })
  }

  return {
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
  }
}
