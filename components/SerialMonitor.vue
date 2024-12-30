`<template>
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
        class="h-[400px] overflow-y-auto space-y-2 font-mono bg-base-100 p-4 rounded-lg"
      >
        <template v-for="message in store.messages" :key="message.id">
          <div :class="[
            'p-2 rounded text-sm',
            message.direction === 'received' ? 'bg-base-200' : 'bg-primary/10'
          ]">
            <div class="text-xs opacity-70" v-if="store.logConfig.showTimestamp">
              {{ new Date(message.timestamp).toLocaleString() }}
            </div>
            <div class="break-all">
              {{ message.data }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { saveAs } from 'file-saver'
const store = useSerialStore()
const monitorRef = ref<HTMLElement>()

function exportLogs() {
  const content = store.messages.map(msg => {
    const timestamp = new Date(msg.timestamp).toLocaleString()
    return `[${timestamp}] ${msg.direction.toUpperCase()}: ${msg.data}`
  }).join('\n')
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, `serial-logs-${new Date().toISOString()}.txt`)
}

// 监听消息变化，自动滚动到底部
watch(() => store.messages.length, () => {
  if (monitorRef.value && store.logConfig.autoScroll) {
    nextTick(() => {
      try {
        monitorRef.value.scrollTop = monitorRef.value.scrollHeight
      } catch (e) {
        console.error('滚动失败:', e)
      }
    })
  }
}, { flush: 'post' })
</script>`