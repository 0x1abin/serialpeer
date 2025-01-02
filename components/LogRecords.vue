<script setup lang="ts">
import { saveAs } from 'file-saver'
import { serialDB } from '~/utils/db'
import { useSerialStore } from '~/stores/serial'

const store = useSerialStore()


const logFiles = ref<Awaited<ReturnType<typeof serialDB.getLogFiles>>>([])
const updateInterval = ref<NodeJS.Timeout>()
const isDeleteMode = ref(false)

async function loadLogFiles() {
  logFiles.value = await serialDB.getLogFiles()
}

// 计算属性：按更新时间倒序排列的文件列表
const sortedLogFiles = computed(() => {
  return [...logFiles.value].sort((a, b) => b.updatedAt - a.updatedAt)
})

function formatFileSize(content: string[]): string {
  const bytes = content.join('\n').length
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return new Date(timestamp).toLocaleString()
}

function formatDisplayName(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

async function downloadLog(file: typeof logFiles.value[0]) {
  const content = file.content.join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const timestamp = new Date(file.createdAt).toISOString().replace(/[:.]/g, '-')
  saveAs(blob, `SerialLog_${timestamp}.txt`)
}

async function deleteLog(id: number) {
  await serialDB.deleteLogFile(id)
  await loadLogFiles()
}

async function toggleLogging() {
  if (store.isLogRecording) {
    store.stopLogRecording()
  } else {
    store.startLogRecording()
  }
}

onMounted(() => {
  loadLogFiles()
  updateInterval.value = setInterval(loadLogFiles, 1000)
})

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})

defineExpose({
  loadLogFiles
})
</script>

<template>
  <div class="card bg-base-200">
    <div class="card-body p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title">Log Records</h2>
        <div class="flex gap-2">
          <button 
            v-if="sortedLogFiles.length > 0"
            class="btn btn-ghost btn-sm btn-square"
            :class="{ 'text-error': isDeleteMode }"
            @click="isDeleteMode = !isDeleteMode"
            title="Delete Mode"
          >
            <Icon name="ph:trash" class="w-5 h-5" />
          </button>
          <button 
            class="btn btn-ghost btn-sm btn-square"
            :class="{ 
              'text-success': store.isLogRecording,
              'opacity-50 cursor-not-allowed': !store.isConnected 
            }"
            @click="toggleLogging"
            :disabled="!store.isConnected"
            :title="store.isLogRecording ? 'Stop Recording' : 'Start Recording'"
          >
            <Icon 
              :name="store.isLogRecording ? 'ph:stop-circle' : 'ph:plus-bold'" 
              class="w-5 h-5" 
            />
          </button>
        </div>
      </div>

      <div class="space-y-2 max-h-[250px] overflow-y-auto">
        <template v-if="sortedLogFiles.length > 0">
          <div 
            v-for="file in sortedLogFiles" 
            :key="file.id"
            class="flex justify-between items-center p-2 bg-base-100 rounded-lg hover:bg-base-200 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <div class="font-medium whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                <div 
                  v-if="store.isLogRecording && file.id === Math.max(...sortedLogFiles.map(f => f.id!))"
                  class="w-2 h-2 rounded-full bg-error animate-pulse"
                  title="Recording"
                />
                {{ formatDisplayName(file.createdAt) }}
              </div>
              <div class="text-sm opacity-70 flex gap-2">
                <span>{{ formatFileSize(file.content) }}</span>
                <span>·</span>
                <span>{{ formatTimestamp(file.updatedAt) }}</span>
              </div>
            </div>
            <div class="flex gap-2 ml-2 shrink-0">
              <button 
                v-if="isDeleteMode"
                class="btn btn-sm btn-error btn-square"
                @click="deleteLog(file.id!)"
                title="Delete"
              >
                <Icon name="ph:trash" class="w-4 h-4" />
              </button>
              <button 
                class="btn btn-sm btn-square"
                @click="downloadLog(file)"
                title="Download"
              >
                <Icon name="ph:download" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>
        <div v-else class="bg-base-content/5 rounded-lg py-2 text-center text-sm text-base-content/50">
          No log files
        </div>
      </div>
    </div>
  </div>
</template> 