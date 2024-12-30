<template>
  <div class="card bg-base-200" :class="{ 'fixed inset-0 z-50': isMaximized }">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title">Serial Monitor</h2>
        <div class="space-x-2 flex items-center">
          <div class="form-control">
            <label class="label cursor-pointer space-x-2">
              <span class="label-text">Timestamp</span>
              <input 
                type="checkbox" 
                class="toggle toggle-sm"
                v-model="store.logConfig.showTimestamp"
              />
            </label>
          </div>
          <button class="btn btn-sm" @click="clearTerminal">
            Clear
          </button>
          <button class="btn btn-sm" @click="exportLogs">
            Export
          </button>
          <button 
            class="btn btn-sm btn-ghost" 
            @click="toggleMaximize"
          >
            <Icon 
              :name="isMaximized ? 'ph:corners-in' : 'ph:corners-out'" 
              class="w-5 h-5"
            />
          </button>
        </div>
      </div>

      <div 
        ref="terminalContainer"
        class="relative"
        :class="isMaximized ? 'h-[calc(100vh-120px)]' : 'h-[400px]'"
      />
    </div>
  </div>

  <div 
    v-if="isMaximized" 
    class="fixed inset-0 bg-black/50 z-40"
    @click="isMaximized = false"
  ></div>
</template>

<script setup lang="ts">
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { saveAs } from 'file-saver'
import 'xterm/css/xterm.css'

const store = useSerialStore()
const terminalContainer = ref<HTMLElement | null>(null)
const terminal = ref<Terminal | null>(null)
const fitAddon = ref<FitAddon | null>(null)
const isMaximized = ref(false)

// 初始化终端
onMounted(() => {
  if (!terminalContainer.value) return

  terminal.value = new Terminal({
    fontSize: 14,
    fontFamily: 'Consolas, Monaco, monospace',
    theme: {
      background: 'var(--b3)',
      foreground: 'var(--bc)',
      cursor: 'var(--bc)',
      black: '#000000',
      red: '#FF0000',
      green: '#00FF00',
      yellow: '#FFFF00',
      blue: '#0000FF',
      magenta: '#FF00FF',
      cyan: '#00FFFF',
      white: '#FFFFFF',
    },
    cursorBlink: true,
    scrollback: 5000,
    convertEol: true
  })

  fitAddon.value = new FitAddon()
  terminal.value.loadAddon(fitAddon.value)
  terminal.value.loadAddon(new WebLinksAddon())

  terminal.value.open(terminalContainer.value)
  fitAddon.value.fit()

  // 修改按键监听逻辑
  terminal.value.onKey(async (e) => {
    if (!store.isConnected) return
    
    e.domEvent.preventDefault() // 阻止默认的按键输入行为

    const char = e.key
    const ctrlKey = e.domEvent.ctrlKey
    const keyCode = e.domEvent.keyCode

    // 处理 Ctrl 组合键
    if (ctrlKey) {
      switch (keyCode) {
        case 65: // Ctrl+A
          await store.sendData('\x01', 'ASCII') // SOH
          break
        case 66: // Ctrl+B
          await store.sendData('\x02', 'ASCII') // STX
          break
        case 67: // Ctrl+C
          await store.sendData('\x03', 'ASCII') // ETX
          break
        case 68: // Ctrl+D
          await store.sendData('\x04', 'ASCII') // EOT
          break
        case 69: // Ctrl+E
          await store.sendData('\x05', 'ASCII') // ENQ
          break
        case 70: // Ctrl+F
          await store.sendData('\x06', 'ASCII') // ACK
          break
        case 71: // Ctrl+G
          await store.sendData('\x07', 'ASCII') // BEL
          break
        case 75: // Ctrl+K
          await store.sendData('\x0B', 'ASCII') // VT
          break
        case 76: // Ctrl+L
          await store.sendData('\x0C', 'ASCII') // FF
          break
        case 78: // Ctrl+N
          await store.sendData('\x0E', 'ASCII') // SO
          break
        case 80: // Ctrl+P
          await store.sendData('\x10', 'ASCII') // DLE
          break
        case 81: // Ctrl+Q
          await store.sendData('\x11', 'ASCII') // DC1/XON
          break
        case 82: // Ctrl+R
          await store.sendData('\x12', 'ASCII') // DC2
          break
        case 83: // Ctrl+S
          await store.sendData('\x13', 'ASCII') // DC3/XOFF
          break
        case 84: // Ctrl+T
          await store.sendData('\x14', 'ASCII') // DC4
          break
        case 85: // Ctrl+U
          await store.sendData('\x15', 'ASCII') // NAK
          break
        case 86: // Ctrl+V
          // 不处理，让系统默认粘贴行为生效
          return
        case 87: // Ctrl+W
          await store.sendData('\x17', 'ASCII') // ETB
          break
        case 88: // Ctrl+X
          await store.sendData('\x18', 'ASCII') // CAN
          break
        case 89: // Ctrl+Y
          await store.sendData('\x19', 'ASCII') // EM
          break
        case 90: // Ctrl+Z
          await store.sendData('\x1A', 'ASCII') // SUB
          break
      }
    } else {
      // 处理普通按键和特殊按键
      if (keyCode === 13) { // Enter key
        await store.sendData('\n', 'ASCII')
      } else if (keyCode === 8) { // Backspace key
        await store.sendData('\b', 'ASCII')
      } else if (keyCode === 27) { // ESC key
        await store.sendData('\x1B', 'ASCII')
      } else if (keyCode === 9) { // Tab key
        await store.sendData('\t', 'ASCII')
      } else {
        // 只发送普通字符，不显示本地回显
        await store.sendData(char, 'ASCII')
      }
    }
  })

  // 添加粘贴事件监听
  terminal.value.onData((data) => {
    if (!store.isConnected) return
    
    // 检查是否是粘贴的数据（通常包含多个字符）
    if (data.length > 1) {
      store.sendData(data, 'ASCII')
    }
  })

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  terminal.value?.dispose()
})

// 修改消息监听，只显示接收到的消息
watch(() => store.messages, (messages) => {
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || !terminal.value) return

  // 只显示接收到的消息
  if (lastMessage.direction === 'received') {
    const timestamp = store.logConfig.showTimestamp
      ? `[${new Date(lastMessage.timestamp).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        })}] `
      : ''

    terminal.value.write(timestamp + lastMessage.data)
  }
}, { deep: true })

function handleResize() {
  fitAddon.value?.fit()
}

function clearTerminal() {
  terminal.value?.clear()
  store.clearMessages()
}

function exportLogs() {
  const content = store.messages.map(msg => {
    const timestamp = store.logConfig.showTimestamp
      ? `[${new Date(msg.timestamp).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        })}] `
      : ''
    return timestamp + msg.data
  }).join('')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, `serial-logs-${new Date().toISOString()}.txt`)
}

function toggleMaximize() {
  isMaximized.value = !isMaximized.value
  nextTick(() => {
    fitAddon.value?.fit()
  })
}

// 添加键盘快捷键
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMaximized.value) {
      isMaximized.value = false
    }
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style>
.xterm {
  height: 100%;
  padding: 8px;
}

.xterm-viewport {
  overflow-y: auto;
}

/* 主题切换过渡 */
.card {
  transition: all 0.3s ease;
}

/* 添加开关样式 */
.form-control {
  display: flex;
  align-items: center;
}

.label {
  padding: 0;
  min-height: auto;
}

/* 添加聚焦样式 */
.xterm:focus {
  outline: 2px solid var(--p);
  outline-offset: 2px;
}
</style>