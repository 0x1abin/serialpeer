<template>
  <div class="card bg-base-200 lg:max-w-sm">
    <div class="card-body">
      <div class="flex flex-col gap-2 mb-4">
        <h2 class="card-title">Quick Commands</h2>
        <button 
          class="btn btn-primary w-full" 
          @click="showAddDialog = true"
        >
          Add Command
        </button>
      </div>

      <div class="space-y-2">
        <div 
          v-for="cmd in store.quickCommands" 
          :key="cmd.id"
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-base-100 rounded-lg gap-2"
        >
          <div class="w-full sm:w-auto">
            <div class="font-medium">{{ cmd.name }}</div>
            <div class="text-sm opacity-70 break-all">{{ cmd.command }}</div>
          </div>
          <button 
            class="btn btn-sm w-full sm:w-auto"
            @click="() => sendCommand(cmd)"
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
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Add Newline</span>
                <input 
                  type="checkbox" 
                  class="toggle toggle-sm"
                  v-model="newCommand.addNewline" 
                />
              </label>
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
  format: 'ASCII',
  addNewline: false
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
    format: 'ASCII',
    addNewline: false
  }
}

function sendCommand(cmd: QuickCommand) {
  let dataToSend = cmd.command
  if (cmd.addNewline && cmd.format === 'ASCII') {
    dataToSend += '\n'
  }
  store.sendData(dataToSend, cmd.format)
}
</script>