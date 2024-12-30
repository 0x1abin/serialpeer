`<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title">Quick Commands</h2>
        <button class="btn btn-sm btn-primary" @click="showAddDialog = true">
          Add Command
        </button>
      </div>

      <div class="space-y-2">
        <div 
          v-for="cmd in store.quickCommands" 
          :key="cmd.id"
          class="flex justify-between items-center p-2 bg-base-100 rounded-lg"
        >
          <div>
            <div class="font-medium">{{ cmd.name }}</div>
            <div class="text-sm opacity-70">{{ cmd.command }}</div>
          </div>
          <button 
            class="btn btn-sm"
            @click="() => store.sendData(cmd.command, cmd.format)"
            :disabled="!store.isConnected"
          >
            Send
          </button>
        </div>
      </div>

      <dialog class="modal" :open="showAddDialog">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Add Quick Command</h3>
          <div class="py-4 space-y-4">
            <div class="form-control">
              <label class="label">Name</label>
              <input v-model="newCommand.name" type="text" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label">Command</label>
              <input v-model="newCommand.command" type="text" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label">Format</label>
              <select v-model="newCommand.format" class="select select-bordered">
                <option value="ASCII">ASCII</option>
                <option value="HEX">HEX</option>
              </select>
            </div>
          </div>
          <div class="modal-action">
            <button class="btn" @click="showAddDialog = false">Cancel</button>
            <button class="btn btn-primary" @click="addCommand">Add</button>
          </div>
        </div>
      </dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuickCommand } from '~/types/serial'

const store = useSerialStore()
const showAddDialog = ref(false)
const newCommand = ref<Omit<QuickCommand, 'id'>>({
  name: '',
  command: '',
  format: 'ASCII'
})

function addCommand() {
  store.addQuickCommand({
    ...newCommand.value,
    id: crypto.randomUUID()
  })
  showAddDialog.value = false
  newCommand.value = {
    name: '',
    command: '',
    format: 'ASCII'
  }
}
</script>`