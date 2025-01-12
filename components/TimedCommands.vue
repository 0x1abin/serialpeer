<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex flex-col gap-2 mb-4">
        <div class="flex justify-between items-center">
          <h2 class="card-title">{{ $t('timedCommands.title') }}</h2>
          <div class="flex gap-2">
            <button 
              v-if="store.timedCommands.length > 0"
              class="btn btn-ghost btn-sm btn-square"
              :class="{ 'text-error': isDeleteMode }"
              @click="isDeleteMode = !isDeleteMode"
              :title="$t('timedCommands.deleteMode')"
            >
              <Icon name="ph:trash" class="w-5 h-5" />
            </button>
            <button 
              class="btn btn-ghost btn-sm btn-square"
              @click="openAddDialog"
              :title="$t('timedCommands.add')"
            >
              <Icon name="ph:plus-bold" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2 max-h-[300px] overflow-y-auto">
        <template v-if="store.timedCommands.length > 0">
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
                {{ cmd.interval }}ms | {{ cmd.isLoop ? $t('timedCommands.loop') : $t('timedCommands.once') }}
              </div>
            </div>
            <div class="flex gap-2">
              <button 
                v-if="isDeleteMode"
                class="btn btn-sm btn-error btn-square"
                @click="() => store.removeTimedCommand(cmd.id)"
                :title="$t('common.delete')"
              >
                <Icon name="ph:trash" class="w-4 h-4" />
              </button>
              <button 
                class="btn btn-sm"
                :class="cmd.isActive ? 'btn-error' : 'btn-success'"
                @click="() => toggleCommand(cmd)"
                :disabled="!store.isConnected"
              >
                {{ cmd.isActive ? $t('timedCommands.stop') : $t('timedCommands.start') }}
              </button>
            </div>
          </div>
        </template>
        <div v-else class="bg-base-content/5 rounded-lg py-2 text-center text-sm text-base-content/50">
          {{ $t('timedCommands.noCommands') }}
        </div>
      </div>

      <dialog class="modal" :open="showDialog">
        <div class="modal-box">
          <h3 class="font-bold text-lg">
            {{ isEditing ? $t('timedCommands.edit') : $t('timedCommands.add') }}
          </h3>
          <TimedCommandForm 
            v-model="commandForm" 
            :quick-commands="store.quickCommands"
          />
          <div class="modal-action">
            <button class="btn" @click="showDialog = false">{{ $t('common.cancel') }}</button>
            <button 
              class="btn btn-primary" 
              @click="handleSubmit"
              :disabled="!commandForm.quickCommandId || !commandForm.interval"
            >
              {{ isEditing ? $t('common.save') : $t('common.add') }}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimedCommand } from '~/composables/interface'
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