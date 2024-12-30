<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title">Data Monitor</h2>
        <div class="space-x-2">
          <button class="btn btn-sm" @click="store.clearMessages">
            Clear
          </button>
          <button class="btn btn-sm" @click="exportLogs">
            Export
          </button>
        </div>
      </div>

      <div 
        ref="monitorRef"
        class="relative h-[400px] font-mono text-sm"
      >
        <textarea
          readonly
          class="w-full h-full p-4 bg-base-300 rounded-lg resize-none focus:outline-none"
          :value="formattedMessages"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { saveAs } from 'file-saver'
const store = useSerialStore()
const monitorRef = ref<HTMLElement>()

// Format messages as terminal-like output
const formattedMessages = computed(() => {
  return store.messages.map(msg => {
    const timestamp = store.logConfig.showTimestamp
      ? `[${new Date(msg.timestamp).toLocaleTimeString()}] `
      : ''
    const direction = msg.direction === 'received' ? '<<' : '>>'
    const format = msg.format === 'HEX' ? '[HEX]' : ''
    return `${timestamp}${direction} ${format}${msg.data}`
  }).join('\n')
})

function exportLogs() {
  const blob = new Blob([formattedMessages.value], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, `serial-logs-${new Date().toISOString()}.txt`)
}

// Watch messages and auto-scroll to bottom
watch(() => store.messages.length, () => {
  if (monitorRef.value && store.logConfig.autoScroll) {
    requestAnimationFrame(() => {
      try {
        const textarea = monitorRef.value.querySelector('textarea')
        if (textarea) {
          textarea.scrollTop = textarea.scrollHeight
        }
      } catch (e) {
        console.error('Scroll failed:', e)
      }
    })
  }
}, { flush: 'post' })
</script>

<style scoped>
textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: scroll;
}

/* 自定义滚动条样式 */
textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

textarea::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.5);
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background-color: rgba(155, 155, 155, 0.7);
}
</style>