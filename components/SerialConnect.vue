`<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">Connection Settings</h2>
      
      <div class="form-control">
        <label class="label">
          <span class="label-text">Baud Rate</span>
        </label>
        <select v-model="store.config.baudRate" class="select select-bordered" :disabled="store.isConnected">
          <option v-for="rate in baudRates" :key="rate" :value="rate">{{ rate }}</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Data Bits</span>
        </label>
        <select v-model="store.config.dataBits" class="select select-bordered" :disabled="store.isConnected">
          <option :value="7">7</option>
          <option :value="8">8</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Stop Bits</span>
        </label>
        <select v-model="store.config.stopBits" class="select select-bordered" :disabled="store.isConnected">
          <option :value="1">1</option>
          <option :value="2">2</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Parity</span>
        </label>
        <select v-model="store.config.parity" class="select select-bordered" :disabled="store.isConnected">
          <option value="none">None</option>
          <option value="even">Even</option>
          <option value="odd">Odd</option>
        </select>
      </div>

      <button 
        class="btn btn-primary mt-4" 
        @click="handleConnection"
        :class="{ 'btn-error': store.isConnected }"
      >
        {{ store.isConnected ? 'Disconnect' : 'Connect' }}
      </button>

      <div v-if="store.error" class="text-error mt-2">
        {{ store.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useSerialStore()
const baudRates = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]

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
</script>`