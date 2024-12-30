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
    // 处理特殊按键
    if (e.domEvent.keyCode === 13) { // Enter key
      await store.sendData('\n', 'ASCII')
    } else if (e.domEvent.keyCode === 8) { // Backspace key
      // 可以选择是否发送退格键
      // await store.sendData('\b', 'ASCII')
    } else {
      // 只发送普通字符，不显示本地回显
      await store.sendData(char, 'ASCII')
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