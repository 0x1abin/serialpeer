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
        <pre
          ref="outputRef"
          class="w-full h-full p-4 bg-base-300 rounded-lg overflow-auto whitespace-pre"
          v-html="formattedMessages"
        ></pre>
      </div>
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
const store = useSerialStore()
const monitorRef = ref<HTMLElement | null>(null)
const outputRef = ref<HTMLElement | null>(null)
const isMaximized = ref(false)

// ANSI 转义序列处理
function processAnsiEscapes(text: string): string {
  const ansiColorMap: Record<string, string> = {
    '30': 'color: #000000', // 黑
    '31': 'color: #ff0000', // 红
    '32': 'color: #00ff00', // 绿
    '33': 'color: #ffff00', // 黄
    '34': 'color: #0000ff', // 蓝
    '35': 'color: #ff00ff', // 紫
    '36': 'color: #00ffff', // 青
    '37': 'color: #ffffff', // 白
    '90': 'color: #808080', // 亮黑
    '91': 'color: #ff8080', // 亮红
    '92': 'color: #80ff80', // 亮绿
    '93': 'color: #ffff80', // 亮黄
    '94': 'color: #8080ff', // 亮蓝
    '95': 'color: #ff80ff', // 亮紫
    '96': 'color: #80ffff', // 亮青
    '97': 'color: #ffffff'  // 亮白
  }

  let result = ''
  let currentSpan = ''
  let inEscape = false
  let escapeSequence = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '\x1b') {
      inEscape = true
      escapeSequence = ''
      continue
    }

    if (inEscape) {
      escapeSequence += char
      if (char === 'm') {
        inEscape = false
        const code = escapeSequence.slice(1, -1) // 移除 [ 和 m
        
        if (code === '0') {
          if (currentSpan) {
            result += '</span>'
            currentSpan = ''
          }
        } else if (ansiColorMap[code]) {
          if (currentSpan) result += '</span>'
          currentSpan = `<span style="${ansiColorMap[code]}">`
          result += currentSpan
        }
      }
      continue
    }

    if (char === '<') {
      result += '&lt;'
    } else if (char === '>') {
      result += '&gt;'
    } else {
      result += char
    }
  }

  if (currentSpan) {
    result += '</span>'
  }

  return result
}

// 格式化消息
const formattedMessages = computed(() => {
  return store.messages.map(msg => {
    const timestamp = store.logConfig.showTimestamp
      ? `[${new Date(msg.timestamp).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        })}] `
      : ''
    return processAnsiEscapes(timestamp + msg.data)
  }).join('')
})

// 自动滚动
watch(() => store.messages.length, () => {
  if (!outputRef.value || !store.logConfig.autoScroll) return

  requestAnimationFrame(() => {
    try {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    } catch (e) {
      console.error('Scroll failed:', e)
    }
  })
}, { flush: 'post' })

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
pre {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  margin: 0;
  tab-size: 4;
}

/* 自定义滚动条样式 */
pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

pre::-webkit-scrollbar-track {
  background: transparent;
}

pre::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.5);
  border-radius: 4px;
}

pre::-webkit-scrollbar-thumb:hover {
  background-color: rgba(155, 155, 155, 0.7);
}

/* 最大化时的过渡动画 */
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
</style>