<template>
  <div class="py-4 space-y-4">
    <div class="form-control">
      <label class="label">{{ $t('timedCommands.form.quickCommand') }}</label>
      <select v-model="command.quickCommandId" class="select select-bordered">
        <option value="" disabled>{{ $t('timedCommands.form.selectCommand') }}</option>
        <option 
          v-for="cmd in quickCommands" 
          :key="cmd.id" 
          :value="cmd.id"
        >
          {{ cmd.name }}
        </option>
      </select>
    </div>
    
    <div class="form-control">
      <label class="label">{{ $t('timedCommands.interval') }}</label>
      <input 
        v-model.number="command.interval" 
        type="number" 
        min="100"
        class="input input-bordered" 
      />
    </div>
    
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">{{ $t('timedCommands.loop') }}</span>
        <input 
          type="checkbox" 
          class="toggle toggle-sm"
          v-model="command.isLoop" 
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimedCommand, QuickCommand } from '~/composables/interface'

const props = defineProps<{
  modelValue: Omit<TimedCommand, 'id' | 'isActive'>,
  quickCommands: QuickCommand[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Omit<TimedCommand, 'id' | 'isActive'>]
}>()

const command = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script> 