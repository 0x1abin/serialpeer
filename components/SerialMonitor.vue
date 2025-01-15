<template>
  <div class="card bg-base-200" :class="{ 'fixed inset-0 z-50': isMaximized }">
    <div class="card-body p-4">
      <div class="flex justify-between items-center mb-2">
        <h2 class="card-title">{{ $t('serialMonitor.title') }}</h2>
        <div class="space-x-2 flex items-center">
          <button class="btn btn-sm" @click="clearTerminal">
            {{ $t('serialMonitor.clear') }}
          </button>
          <button class="btn btn-sm" @click="exportLogs">
            {{ $t('serialMonitor.export') }}
          </button>
          <button 
            class="btn btn-sm btn-ghost" 
            @click="toggleMaximize"
            :title="isMaximized ? $t('serialMonitor.minimize') : $t('serialMonitor.maximize')"
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
        class="relative rounded-lg overflow-hidden"
        :class="isMaximized ? 'h-[calc(100vh-90px)]' : 'h-[570px]'"
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
import { saveAs } from 'file-saver'
import '@xterm/xterm/css/xterm.css'
import { useTerminal } from '~/composables/useTerminal'
import { handleKeyboardEvent } from '~/utils/keyboardHandler'

const store = useSerialStore()
const terminalContainer = ref<HTMLElement | null>(null)
const isMaximized = ref(false)
const { terminal, initTerminal, handleResize, dispose } = useTerminal()

// 初始化终端
onMounted(() => {
  if (!terminalContainer.value) return
  
  initTerminal(terminalContainer.value)
  
  // 设置键盘事件监听
  terminal.value?.onKey(e => handleKeyboardEvent(e, store))
  
  // 设置粘贴事件监听
  terminal.value?.onData(handlePasteData)
  
  window.addEventListener('resize', handleResize)

  store.addEventListener('data', (event) => {
    if (event?.data) {
      terminal.value?.write(event.data)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  dispose()
})

function handlePasteData(data: string) {
  if (!store.isConnected) return
  if (data.length > 1) {
    store.sendData(data, 'ASCII')
  }
}

function clearTerminal() {
  terminal.value?.clear()
}

function exportLogs() {
  if (!terminal.value) return
  
  const buffer = terminal.value.buffer.active
  const lineCount = buffer.length
  const lines: string[] = []
  
  for (let i = 0; i < lineCount; i++) {
    const line = buffer.getLine(i)
    if (line) {
      lines.push(line.translateToString().trim())
    }
  }
  
  const content = lines.join('\n').replace(/\[\d+(?:;\d+)*m/g, '') // remove color tags
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, `serial-logs-${new Date().toISOString()}.txt`)
}

function toggleMaximize() {
  isMaximized.value = !isMaximized.value
  nextTick(() => {
    handleResize()
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
  border-radius: 0.5rem;
}

.xterm-viewport {
  overflow-y: auto !important;
  border-radius: 0.5rem;
}

.card {
  transition: all 0.3s ease;
}

.card-body {
  padding: 1rem;
}

.xterm:focus {
  outline: 2px solid var(--p);
  outline-offset: -2px;
  border-radius: 0.5rem;
}

.terminal-container {
  background-color: var(--b3);
  border-radius: 0.5rem;
}
</style>