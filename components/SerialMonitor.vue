<template>
  <div class="card bg-base-200" :class="{ 'fixed inset-0 z-50': isMaximized }">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title">Data Monitor</h2>
        <div class="space-x-2 flex items-center">
          <button class="btn btn-sm" @click="store.clearMessages">
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
        ref="monitorRef"
        class="relative font-mono text-sm"
        :class="isMaximized ? 'h-[calc(100vh-120px)]' : 'h-[400px]'"
      >
        <textarea
          readonly
          class="w-full h-full p-4 bg-base-300 rounded-lg resize-none focus:outline-none"
          :value="formattedMessages"
        ></textarea>
      </div>
    </div>
  </div>

  <!-- 最大化时的背景遮罩 -->
  <div 
    v-if="isMaximized" 
    class="fixed inset-0 bg-black/50 z-40"
    @click="isMaximized = false"
  ></div>
</template>

<script setup lang="ts">
import { saveAs } from 'file-saver'
const store = useSerialStore()
const monitorRef = ref<HTMLElement>()
const isMaximized = ref(false)

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

function toggleMaximize() {
  isMaximized.value = !isMaximized.value
  // 切换后需要重新滚动到底部
  nextTick(() => {
    if (monitorRef.value && store.logConfig.autoScroll) {
      const textarea = monitorRef.value.querySelector('textarea')
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight
      }
    }
  })
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

/* 最大化时的过渡动画 */
.card {
  transition: all 0.3s ease;
}
</style>