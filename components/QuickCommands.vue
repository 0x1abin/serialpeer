<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex flex-col gap-2 mb-4">
        <h2 class="card-title">Quick Commands</h2>
        <button 
          class="btn btn-primary w-full" 
          @click="openAddDialog"
        >
          Add Command
        </button>
      </div>

      <div class="space-y-2 max-h-[300px] overflow-y-auto">
        <div 
          v-for="cmd in store.quickCommands" 
          :key="cmd.id"
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-base-100 rounded-lg gap-2"
        >
          <div class="flex-1 cursor-pointer" @click="() => openEditDialog(cmd)">
            <div class="font-medium">{{ cmd.name }}</div>
            <div class="text-sm opacity-70 break-all">{{ cmd.command }}</div>
          </div>
          <div class="flex gap-2">
            <button 
              class="btn btn-sm btn-error btn-square"
              @click="() => store.removeQuickCommand(cmd.id)"
            >
              <Icon name="ph:trash" class="w-4 h-4" />
            </button>
            <button 
              class="btn btn-sm"
              @click="() => sendCommand(cmd)"
              :disabled="!store.isConnected"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <dialog class="modal" :open="showDialog">
        <div class="modal-box">
          <h3 class="font-bold text-lg">
            {{ isEditing ? 'Edit' : 'Add' }} Quick Command
          </h3>
          <QuickCommandForm v-model="commandForm" />
          <div class="modal-action">
            <button class="btn" @click="showDialog = false">Cancel</button>
            <button class="btn btn-primary" @click="handleSubmit">
              {{ isEditing ? 'Save' : 'Add' }}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuickCommand } from '~/types/serial'
import { useSerialStore } from '~/stores/serial'

const store = useSerialStore()
const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const commandForm = ref<Omit<QuickCommand, 'id'>>({
  name: '',
  command: '',
  format: 'ASCII',
  addNewline: false
})

function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  commandForm.value = {
    name: '',
    command: '',
    format: 'ASCII',
    addNewline: false
  }
  showDialog.value = true
}

function openEditDialog(cmd: QuickCommand) {
  isEditing.value = true
  editingId.value = cmd.id
  commandForm.value = {
    name: cmd.name,
    command: cmd.command,
    format: cmd.format,
    addNewline: cmd.addNewline
  }
  showDialog.value = true
}

function handleSubmit() {
  if (isEditing.value && editingId.value) {
    store.updateQuickCommand({
      ...commandForm.value,
      id: editingId.value
    })
  } else {
    store.addQuickCommand({
      ...commandForm.value,
      id: crypto.randomUUID()
    })
  }
  showDialog.value = false
}

function sendCommand(cmd: QuickCommand) {
  let dataToSend = cmd.command
  if (cmd.addNewline && cmd.format === 'ASCII') {
    dataToSend += '\n'
  }
  store.sendData(dataToSend, cmd.format)
}
</script>