<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title mb-4">Connection Settings</h2>
      
      <div class="space-y-4">
        <div class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">Baud Rate</div>
            <select v-model="selectedBaudRate" class="select select-bordered w-full" :disabled="store.isConnected">
              <option v-for="rate in baudRates" :key="rate" :value="rate">{{ rate }}</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div v-if="selectedBaudRate === 'custom'" class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">Custom Baud Rate</div>
            <input
              v-model.number="customBaudRate"
              type="number"
              class="input input-bordered w-full"
              :disabled="store.isConnected"
              min="1"
              placeholder="Enter custom baud rate"
              @input="updateBaudRate"
            />
          </div>
        </div>

        <div class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">Data Bits</div>
            <select v-model="store.config.dataBits" class="select select-bordered w-full" :disabled="store.isConnected">
              <option :value="7">7</option>
              <option :value="8">8</option>
            </select>
          </div>
        </div>

        <div class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">Stop Bits</div>
            <select v-model="store.config.stopBits" class="select select-bordered w-full" :disabled="store.isConnected">
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </div>
        </div>

        <div class="form-control w-full">
          <div class="join join-vertical w-full">
            <div class="px-1">Parity</div>
            <select v-model="store.config.parity" class="select select-bordered w-full" :disabled="store.isConnected">
              <option value="none">None</option>
              <option value="even">Even</option>
              <option value="odd">Odd</option>
            </select>
          </div>
        </div>

        <button 
          class="btn btn-primary w-full" 
          @click="handleConnection"
          :class="{ 'btn-error': store.isConnected }"
        >
          {{ store.isConnected ? 'Disconnect' : 'Connect' }}
        </button>

        <div v-if="store.error" class="alert alert-error mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ store.error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useSerialStore()
const baudRates = [4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800]
const DEFAULT_BAUD_RATE = 115200

// Load saved settings from localStorage, use default values if not found
const savedSettings = JSON.parse(localStorage.getItem('serialSettings') || '{}')

// Initialize baud rate selection and check if it's a custom value
const isCustomBaudRate = savedSettings.baudRate ? !baudRates.includes(savedSettings.baudRate) : false
const selectedBaudRate = ref(isCustomBaudRate ? 'custom' : (savedSettings.baudRate || DEFAULT_BAUD_RATE))
const customBaudRate = ref(isCustomBaudRate ? savedSettings.baudRate : DEFAULT_BAUD_RATE)

// Apply saved settings when component is mounted
onMounted(() => {
  if (savedSettings.baudRate) {
    // If using custom baud rate, apply the saved custom value
    if (isCustomBaudRate) {
      store.config.baudRate = savedSettings.baudRate
    } else {
      store.config.baudRate = savedSettings.baudRate
    }
    store.config.dataBits = savedSettings.dataBits || store.config.dataBits
    store.config.stopBits = savedSettings.stopBits || store.config.stopBits
    store.config.parity = savedSettings.parity || store.config.parity
  } else {
    // Set default baud rate to 115200 from the list
    store.config.baudRate = DEFAULT_BAUD_RATE
  }
})

// Watch for settings changes and save to localStorage
watch(
  () => ({
    baudRate: store.config.baudRate,
    dataBits: store.config.dataBits,
    stopBits: store.config.stopBits,
    parity: store.config.parity
  }),
  (newSettings) => {
    localStorage.setItem('serialSettings', JSON.stringify(newSettings))
  },
  { deep: true }
)

watch(selectedBaudRate, (newValue) => {
  if (newValue !== 'custom') {
    store.config.baudRate = newValue
  } else {
    // When switching to custom mode, use the previous custom value
    store.config.baudRate = customBaudRate.value
  }
})

function updateBaudRate() {
  if (customBaudRate.value > 0) {
    store.config.baudRate = customBaudRate.value
  }
}

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