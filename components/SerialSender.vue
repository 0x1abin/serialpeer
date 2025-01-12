`<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">{{ $t('serialSender.title') }}</h2>
      
      <textarea
        v-model="message"
        class="textarea textarea-bordered w-full"
        rows="3"
        :placeholder="$t('serialSender.placeholder')"
        :disabled="!store.isConnected"
      ></textarea>

      <div class="flex flex-wrap gap-4 justify-between items-center mt-4">
        <div class="flex items-center gap-4">
          <select v-model="format" class="select select-bordered">
            <option value="ASCII">{{ $t('serialSender.format.ascii') }}</option>
            <option value="HEX">{{ $t('serialSender.format.hex') }}</option>
          </select>

          <label class="label cursor-pointer space-x-2">
            <span class="label-text">{{ $t('serialSender.autoNewline') }}</span>
            <input 
              type="checkbox" 
              class="toggle toggle-sm"
              v-model="autoNewline"
            />
          </label>
        </div>

        <button 
          class="btn btn-primary"
          :disabled="!store.isConnected || !message"
          @click="store.sendData(message, format)"
        >
          {{ $t('serialSender.send') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useSerialStore()
const message = ref('')
const format = ref<'ASCII' | 'HEX'>('ASCII')
const autoNewline = ref(false)

// Watch for format changes
watch(format, (newFormat) => {
  if (newFormat === 'HEX') {
    // Format current input when switching to HEX mode
    message.value = formatHexInput(message.value)
  } else {
    // Remove spaces when switching back to ASCII mode
    message.value = message.value.replace(/\s/g, '')
  }
})

// Watch for message input
watch(message, (newValue) => {
  if (format.value === 'HEX') {
    // Automatically format HEX input
    const cursorPosition = (document.activeElement as HTMLTextAreaElement)?.selectionStart || 0
    const formattedValue = formatHexInput(newValue)
    if (formattedValue !== newValue) {
      message.value = formattedValue
      // Restore cursor position
      nextTick(() => {
        const textarea = document.querySelector('textarea')
        if (textarea) {
          const newPosition = Math.min(cursorPosition, formattedValue.length)
          textarea.setSelectionRange(newPosition, newPosition)
        }
      })
    }
  }
})
</script>