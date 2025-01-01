<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex flex-col gap-2 mb-4">
        <h2 class="card-title">Timed Commands</h2>
        <button 
          class="btn btn-primary w-full" 
          @click="openAddDialog"
        >
          Add
        </button>
      </div>

      <div class="space-y-2">
        <div 
          v-for="cmd in store.timedCommands" 
          :key="cmd.id"
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-base-100 rounded-lg gap-2"
        >
          <div class="flex-1">
            <div class="font-medium">
              {{ getQuickCommandName(cmd.quickCommandId) }}
            </div>
            <div class="text-sm opacity-70">
              {{ cmd.interval }}ms | {{ cmd.isLoop ? 'Loop' : 'Once' }}
            </div>
          </div>
          <div class="flex gap-2">
            <button 
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
          <h3 class="font-bold text-lg">Add Timed Command</h3>
          <div class="py-4 space-y-4">
            <div class="form-control">
              <label class="label">Quick Command</label>
              <select v-model="commandForm.quickCommandId" class="select select-bordered">
                <option value="" disabled>Select a command</option>
                <option 
                  v-for="cmd in store.quickCommands" 
                  :key="cmd.id" 
                  :value="cmd.id"
                >
                  {{ cmd.name }}
                </option>
              </select>
            </div>
            
            <div class="form-control">
              <label class="label">Interval (ms)</label>
              <input 
                v-model.number="commandForm.interval" 
                type="number" 
                min="100"
                class="input input-bordered" 
              />
            </div>
            
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Loop</span>
                <input 
                  type="checkbox" 
                  class="toggle toggle-sm"
                  v-model="commandForm.isLoop" 
                />
              </label>
            </div>
          </div>
          <div class="modal-action">
            <button class="btn" @click="showDialog = false">Cancel</button>
            <button 
              class="btn btn-primary" 
              @click="handleSubmit"
              :disabled="!commandForm.quickCommandId || !commandForm.interval"
            >
              Add
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
const commandForm = ref<Omit<TimedCommand, 'id' | 'isActive'>>({
  quickCommandId: '',
  interval: 1000,
  isLoop: false,
})

function getQuickCommandName(id: string) {
  return store.quickCommands.find(cmd => cmd.id === id)?.name || 'Unknown'
}

function openAddDialog() {
  commandForm.value = {
    quickCommandId: '',
    interval: 1000,
    isLoop: false,
  }
  showDialog.value = true
}

function handleSubmit() {
  store.addTimedCommand({
    ...commandForm.value,
    id: crypto.randomUUID(),
    isActive: false,
  })
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