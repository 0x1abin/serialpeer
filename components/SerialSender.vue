`<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">Send Data</h2>
      
      <textarea
        v-model="message"
        class="textarea textarea-bordered w-full"
        rows="3"
        placeholder="Enter data to send..."
        :disabled="!store.isConnected"
      ></textarea>

      <div class="flex justify-between items-center mt-4">
        <select v-model="format" class="select select-bordered">
          <option value="ASCII">ASCII</option>
          <option value="HEX">HEX</option>
        </select>

        <button 
          class="btn btn-primary"
          :disabled="!store.isConnected || !message"
          @click="sendMessage"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useSerialStore()
const message = ref('')
const format = ref<'ASCII' | 'HEX'>('ASCII')

async function sendMessage() {
  if (!message.value) return
  
  try {
    await store.sendData(message.value, format.value)
    message.value = ''
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}
</script>`