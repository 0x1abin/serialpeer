<template>
  <button class="btn btn-ghost" @click="toggleColorMode">
    <Icon 
      :name="colorMode.value === 'dark' ? 'ph:sun' : 'ph:moon'" 
      class="w-5 h-5" 
    />
    {{ colorMode.value === 'dark' ? 'Light Mode' : 'Dark Mode' }}
  </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>