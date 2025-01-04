<script setup lang="ts">
import { saveAs } from 'file-saver'
import { serialDB } from '~/utils/db'
import { useSerialStore } from '~/stores/serial'

// Types
interface LogFile {
  id: number
  content: string[]
  createdAt: number
  updatedAt: number
}

// Store and composables
const store = useSerialStore()
const { t, locale } = useI18n()

// State
const logFiles = ref<LogFile[]>([])
const updateInterval = ref<NodeJS.Timeout>()
const isDeleteMode = ref(false)

// Computed
const sortedLogFiles = computed(() => {
  return [...logFiles.value].sort((a, b) => b.updatedAt - a.updatedAt)
})

// Get the ID of the most recent log file
const mostRecentLogId = computed(() => {
  const ids = sortedLogFiles.value.map(f => f.id)
  return ids.length ? Math.max(...ids) : -1
})

// Methods
/**
 * Load log files from the database
 */
async function loadLogFiles() {
  logFiles.value = await serialDB.getLogFiles()
}

/**
 * Format file size with appropriate units (B, KB, MB)
 */
function formatFileSize(content: string[]): string {
  const bytes = content.join('\n').length
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format timestamp relative to current time
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) {
    return t('logRecords.timeFormat.justNow')
  }
  
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return t('logRecords.timeFormat.minutesAgo', { n: minutes })
  }
  
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return t('logRecords.timeFormat.hoursAgo', { n: hours })
  }
  
  return new Date(timestamp).toLocaleString(locale.value)
}

/**
 * Format display name using timestamp
 */
function formatDisplayName(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

/**
 * Download log file as text
 */
async function downloadLog(file: LogFile) {
  const content = file.content.join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const timestamp = new Date(file.createdAt).toISOString().replace(/[:.]/g, '-')
  saveAs(blob, `SerialLog_${timestamp}.txt`)
}

/**
 * Delete log file by ID
 */
async function deleteLog(id: number) {
  await serialDB.deleteLogFile(id)
  await loadLogFiles()
}

/**
 * Toggle log recording state
 */
function toggleLogging() {
  if (store.isLogRecording) {
    store.stopLogRecording()
  } else {
    store.startLogRecording()
  }
}

// Lifecycle hooks
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
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title">{{ $t('logRecords.title') }}</h2>
        <div class="flex gap-2">
          <!-- Delete mode toggle -->
          <button 
            v-if="sortedLogFiles.length > 0"
            class="btn btn-ghost btn-sm btn-square"
            :class="{ 'text-error': isDeleteMode }"
            @click="isDeleteMode = !isDeleteMode"
            :title="$t('logRecords.deleteMode')"
          >
            <Icon name="ph:trash" class="w-5 h-5" />
          </button>
          
          <!-- Record toggle -->
          <button 
            class="btn btn-ghost btn-sm btn-square"
            :class="{ 
              'text-success': store.isLogRecording,
              'opacity-50 cursor-not-allowed': !store.isConnected 
            }"
            @click="toggleLogging"
            :disabled="!store.isConnected"
            :title="store.isLogRecording ? 
              $t('logRecords.stopRecording') : 
              $t('logRecords.startRecording')"
          >
            <Icon 
              :name="store.isLogRecording ? 'ph:stop-circle' : 'ph:plus-bold'" 
              class="w-5 h-5" 
            />
          </button>
        </div>
      </div>

      <!-- Log files list -->
      <div class="space-y-2 max-h-[250px] overflow-y-auto">
        <template v-if="sortedLogFiles.length > 0">
          <div 
            v-for="file in sortedLogFiles" 
            :key="file.id"
            class="flex justify-between items-center p-2 bg-base-100 rounded-lg hover:bg-base-200 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <!-- File name and recording indicator -->
              <div class="font-medium whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                <div 
                  v-if="store.isLogRecording && file.id === mostRecentLogId"
                  class="w-2 h-2 rounded-full bg-error animate-pulse"
                  :title="$t('logRecords.recording')"
                />
                {{ formatDisplayName(file.createdAt) }}
              </div>
              
              <!-- File metadata -->
              <div class="text-sm opacity-70 flex gap-2">
                <span>{{ formatFileSize(file.content) }}</span>
                <span>·</span>
                <span>{{ formatTimestamp(file.updatedAt) }}</span>
              </div>
            </div>
            
            <!-- Action buttons -->
            <div class="flex gap-2 ml-2 shrink-0">
              <button 
                v-if="isDeleteMode"
                class="btn btn-sm btn-error btn-square"
                @click="deleteLog(file.id)"
                :title="$t('logRecords.delete')"
              >
                <Icon name="ph:trash" class="w-4 h-4" />
              </button>
              <button 
                class="btn btn-sm btn-square"
                @click="downloadLog(file)"
                :title="$t('logRecords.download')"
              >
                <Icon name="ph:download" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>
        
        <!-- Empty state -->
        <div v-else class="bg-base-content/5 rounded-lg py-2 text-center text-sm text-base-content/50">
          {{ $t('logRecords.noLogs') }}
        </div>
      </div>
    </div>
  </div>
</template> 