<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <div class="flex flex-col gap-2 mb-4">
        <div class="flex justify-between items-center">
          <h2 class="card-title">{{ $t('quickCommands.title') }}</h2>
          <div class="flex gap-2">
            <button 
              v-if="store.quickCommands.length > 0"
              class="btn btn-ghost btn-sm btn-square"
              :class="{ 'text-error': isDeleteMode }"
              @click="isDeleteMode = !isDeleteMode"
              :title="$t('quickCommands.deleteMode')"
            >
              <Icon name="ph:trash" class="w-5 h-5" />
            </button>
            <button 
              class="btn btn-ghost btn-sm btn-square"
              @click="openAddDialog"
              :title="$t('quickCommands.add')"
            >
              <Icon name="ph:plus-bold" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2 max-h-[300px] overflow-y-auto">
        <template v-if="store.quickCommands.length > 0">
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
                v-if="isDeleteMode"
                class="btn btn-sm btn-error btn-square"
                @click="() => store.removeQuickCommand(cmd.id)"
                :title="$t('quickCommands.delete')"
              >
                <Icon name="ph:trash" class="w-4 h-4" />
              </button>
              <button 
                class="btn btn-sm"
                @click="() => sendCommand(cmd)"
                :disabled="!store.isConnected"
                :title="$t('quickCommands.send')"
              >
                {{ $t('quickCommands.send') }}
              </button>
            </div>
          </div>
        </template>
        <div v-else class="bg-base-content/5 rounded-lg py-2 text-center text-sm text-base-content/50">
          {{ $t('quickCommands.noCommands') }}
        </div>
      </div>

      <dialog class="modal" :open="showDialog">
        <div class="modal-box">
          <h3 class="font-bold text-lg">
            {{ isEditing ? $t('quickCommands.edit') : $t('quickCommands.add') }} {{ $t('quickCommands.quickCommand') }}
          </h3>
          <QuickCommandForm v-model="commandForm" />
          <div class="modal-action">
            <button class="btn" @click="showDialog = false">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="handleSubmit">
              {{ isEditing ? $t('common.save') : $t('common.add') }}
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
const isDeleteMode = ref(false)

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
    dataToSend += '\r\n'
  }
  store.sendData(dataToSend, cmd.format)
}
</script>