<template>
  <div class="py-4 space-y-4">
    <div class="form-control">
      <label class="label">Quick Command</label>
      <select v-model="command.quickCommandId" class="select select-bordered">
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
        v-model.number="command.interval" 
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
          v-model="command.isLoop" 
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimedCommand } from '~/types/serial'
import { useSerialStore } from '~/stores/serial'

const store = useSerialStore()

const props = defineProps<{
  modelValue: Omit<TimedCommand, 'id' | 'isActive'>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Omit<TimedCommand, 'id' | 'isActive'>]
}>()

const command = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script> 