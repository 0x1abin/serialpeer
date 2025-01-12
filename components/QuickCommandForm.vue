<template>
  <div class="py-4 space-y-4">
    <div class="form-control">
      <label class="label">{{ $t('quickCommands.form.name') }}</label>
      <input 
        v-model="command.name" 
        type="text" 
        class="input input-bordered" 
        :class="{ 'input-error': error }"
      />
      <label v-if="error" class="label">
        <span class="label-text-alt text-error">{{ error }}</span>
      </label>
    </div>
    
    <div class="form-control">
      <label class="label">{{ $t('quickCommands.form.command') }}</label>
      <input 
        v-model="localCommand" 
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
import type { QuickCommand } from '~/composables/interface'

const props = defineProps<{
  modelValue: Omit<QuickCommand, 'id'>,
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Omit<QuickCommand, 'id'>]
}>()

const localCommand = computed({
  get: () => {
    if (props.modelValue.format === 'HEX') {
      return formatHexInput(props.modelValue.command)
    }
    return props.modelValue.command
  },
  set: (value) => {
    const newCommand = {
      ...props.modelValue,
      command: props.modelValue.format === 'HEX' 
        ? value.replace(/[^0-9A-Fa-f]/g, '')
        : value
    }
    emit('update:modelValue', newCommand)
  }
})

// 监听格式变化
watch(() => props.modelValue.format, (newFormat) => {
  const currentCommand = props.modelValue.command
  if (newFormat === 'HEX') {
    // 切换到 HEX 模式时格式化输入
    emit('update:modelValue', {
      ...props.modelValue,
      command: currentCommand.replace(/[^0-9A-Fa-f]/g, '')
    })
  }
})

const command = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script> 