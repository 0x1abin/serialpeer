<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title mb-4">{{ $t('serialConnect.title') }}</h2>
      
      <div class="space-y-4">
        <div class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">{{ $t('serialConnect.baudRate') }}</div>
            <select v-model="selectedBaudRate" class="select select-bordered w-full" :disabled="store.isConnected">
              <option v-for="rate in baudRates" :key="rate" :value="rate">{{ rate }}</option>
              <option value="custom">{{ $t('serialConnect.customBaudRate') }}</option>
            </select>
          </div>
        </div>

        <div v-if="selectedBaudRate === 'custom'" class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">{{ $t('serialConnect.customBaudRate') }}</div>
            <input
              v-model.number="customBaudRate"
              type="number"
              class="input input-bordered w-full"
              :disabled="store.isConnected"
              min="1"
              :placeholder="$t('serialConnect.customBaudRate')"
            />
          </div>
        </div>

        <div class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">{{ $t('serialConnect.dataBits') }}</div>
            <select v-model="store.config.dataBits" class="select select-bordered w-full" :disabled="store.isConnected">
              <option :value="7">7</option>
              <option :value="8">8</option>
            </select>
          </div>
        </div>

        <div class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">{{ $t('serialConnect.stopBits') }}</div>
            <select v-model="store.config.stopBits" class="select select-bordered w-full" :disabled="store.isConnected">
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </div>
        </div>

        <div class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">{{ $t('serialConnect.parity') }}</div>
            <select v-model="store.config.parity" class="select select-bordered w-full" :disabled="store.isConnected">
              <option value="none">{{ $t('serialConnect.parityOptions.none') }}</option>
              <option value="even">{{ $t('serialConnect.parityOptions.even') }}</option>
              <option value="odd">{{ $t('serialConnect.parityOptions.odd') }}</option>
            </select>
          </div>
        </div>

        <button 
          class="btn btn-primary w-full" 
          @click="handleConnection"
          :class="{ 'btn-error': store.isConnected }"
        >
          {{ store.isConnected ? $t('serialConnect.disconnect') : $t('serialConnect.connect') }}
        </button>

        <div v-if="store.error" class="alert alert-error mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ $t('serialConnect.connectionError') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useSerialStore()

const baudRates = [4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800]
const DEFAULT_BAUD_RATE = 115200

// Reactive state
const selectedBaudRate = ref<number | 'custom'>(DEFAULT_BAUD_RATE)
const customBaudRate = ref<number>(DEFAULT_BAUD_RATE)

// Load saved settings from localStorage
const savedSettings = JSON.parse(localStorage.getItem('serialSettings') || '{}')

// Initialize settings
onMounted(() => {
  const savedBaudRate = savedSettings.baudRate || DEFAULT_BAUD_RATE
  const isCustom = !baudRates.includes(savedBaudRate)

  selectedBaudRate.value = isCustom ? 'custom' : savedBaudRate
  customBaudRate.value = isCustom ? savedBaudRate : DEFAULT_BAUD_RATE

  store.config.baudRate = savedBaudRate
  store.config.dataBits = savedSettings.dataBits || store.config.dataBits
  store.config.stopBits = savedSettings.stopBits || store.config.stopBits
  store.config.parity = savedSettings.parity || store.config.parity
})

// Watch for settings changes and save to localStorage
watch(
  () => store.config,
  (newSettings) => {
    localStorage.setItem('serialSettings', JSON.stringify(newSettings))
  },
  { deep: true }
)

// Watch for baud rate changes
watch(selectedBaudRate, (newValue) => {
  if (newValue !== 'custom') {
    store.config.baudRate = newValue as number
  } else {
    store.config.baudRate = customBaudRate.value
  }
})

watch(customBaudRate, (newValue) => {
  if (selectedBaudRate.value === 'custom' && newValue > 0) {
    store.config.baudRate = newValue
  }
})

/**
 * Handle connection and disconnection
 */
async function handleConnection() {
  try {
    if (store.isConnected) {
      await store.disconnect()
    } else {
      await store.connect()
    }
  } catch (error) {
    console.error('Connection operation failed:', error)
  }
}
</script>

<style scoped>
.card {
  transition: all 0.3s ease;
}

.form-control {
  margin-bottom: 0;
}

.join-vertical > div:first-child {
  text-align: left;
  padding-bottom: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: hsl(var(--bc) / 0.6);
}

.select {
  height: 3rem;
  min-height: 3rem;
}

.text-error {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
</style>