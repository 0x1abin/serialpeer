`<template>
  <UButton
    :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
    color="gray"
    variant="ghost"
    @click="toggleColorMode"
  >
    {{ colorMode.value === 'dark' ? '浅色模式' : '深色模式' }}
  </UButton>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>`