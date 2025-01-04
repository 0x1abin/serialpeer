<template>
  <div class="py-4 space-y-4">
    <div class="form-control">
      <label class="label">{{ $t('quickCommands.form.name') }}</label>
      <input 
        v-model="command.name" 
        type="text" 
        class="input input-bordered" 
      />
    </div>
    
    <div class="form-control">
      <label class="label">{{ $t('quickCommands.form.command') }}</label>
      <input 
        v-model="command.command" 
        type="text" 
        class="input input-bordered" 
      />
    </div>
    
    <div class="form-control">
      <label class="label">{{ $t('quickCommands.form.format') }}</label>
      <select v-model="command.format" class="select select-bordered">
        <option value="ASCII">ASCII</option>
        <option value="HEX">HEX</option>
      </select>
    </div>
    
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">{{ $t('quickCommands.form.addNewline') }}</span>
        <input 
          type="checkbox" 
          class="toggle toggle-sm"
          v-model="command.addNewline" 
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuickCommand } from '~/types/serial'

const props = defineProps<{
  modelValue: Omit<QuickCommand, 'id'>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Omit<QuickCommand, 'id'>]
}>()

const command = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script> 