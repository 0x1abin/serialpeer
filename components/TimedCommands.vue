<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex flex-col gap-2 mb-4">
        <div class="flex justify-between items-center">
          <h2 class="card-title">Timed Commands</h2>
          <div class="flex gap-2">
            <button 
              class="btn btn-ghost btn-sm btn-square"
              :class="{ 'text-error': isDeleteMode }"
              @click="isDeleteMode = !isDeleteMode"
              title="Delete Mode"
            >
              <Icon name="ph:trash" class="w-5 h-5" />
            </button>
            <button 
              class="btn btn-ghost btn-sm btn-square"
              @click="openAddDialog"
            >
              <Icon name="ph:plus-bold" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2 max-h-[300px] overflow-y-auto">
        <div 
          v-for="cmd in store.timedCommands" 
          :key="cmd.id"
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-base-100 rounded-lg gap-2"
        >
          <div class="flex-1 cursor-pointer" @click="() => openEditDialog(cmd)">
            <div class="font-medium">
              {{ getQuickCommandName(cmd.quickCommandId) }}
            </div>
            <div class="text-sm opacity-70">
              {{ cmd.interval }}ms | {{ cmd.isLoop ? 'Loop' : 'Once' }}
            </div>
          </div>
          <div class="flex gap-2">
            <button 
              v-if="isDeleteMode"
              class="btn btn-sm btn-error btn-square"
              @click="() => store.removeTimedCommand(cmd.id)"
            >
              <Icon name="ph:trash" class="w-4 h-4" />
            </button>
            <button 
              class="btn btn-sm"
              :class="cmd.isActive ? 'btn-error' : 'btn-success'"
              @click="() => toggleCommand(cmd)"
              :disabled="!store.isConnected"
            >
              {{ cmd.isActive ? 'Stop' : 'Start' }}
            </button>
          </div>
        </div>
      </div>

      <dialog class="modal" :open="showDialog">
        <div class="modal-box">
          <h3 class="font-bold text-lg">
            {{ isEditing ? 'Edit' : 'Add' }} Timed Command
          </h3>
          <TimedCommandForm v-model="commandForm" />
          <div class="modal-action">
            <button class="btn" @click="showDialog = false">Cancel</button>
            <button 
              class="btn btn-primary" 
              @click="handleSubmit"
              :disabled="!commandForm.quickCommandId || !commandForm.interval"
            >
              {{ isEditing ? 'Save' : 'Add' }}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimedCommand } from '~/types/serial'
import { useSerialStore } from '~/stores/serial'

const store = useSerialStore()
const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const commandForm = ref<Omit<TimedCommand, 'id' | 'isActive'>>({
  quickCommandId: '',
  interval: 1000,
  isLoop: false,
})
const isDeleteMode = ref(false)

function getQuickCommandName(id: string) {
  return store.quickCommands.find(cmd => cmd.id === id)?.name || 'Unknown'
}

function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  commandForm.value = {
    quickCommandId: '',
    interval: 1000,
    isLoop: false,
  }
  showDialog.value = true
}

function openEditDialog(cmd: TimedCommand) {
  isEditing.value = true
  editingId.value = cmd.id
  commandForm.value = {
    quickCommandId: cmd.quickCommandId,
    interval: cmd.interval,
    isLoop: cmd.isLoop,
  }
  showDialog.value = true
}

function handleSubmit() {
  if (isEditing.value && editingId.value) {
    store.updateTimedCommand({
      ...commandForm.value,
      id: editingId.value,
      isActive: false,
    })
  } else {
    store.addTimedCommand({
      ...commandForm.value,
      id: crypto.randomUUID(),
      isActive: false,
    })
  }
  showDialog.value = false
}

function toggleCommand(cmd: TimedCommand) {
  if (cmd.isActive) {
    store.stopTimedCommand(cmd.id)
  } else {
    store.startTimedCommand(cmd.id)
  }
}
</script> 