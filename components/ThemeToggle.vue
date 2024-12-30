`<template>
  <button class="btn btn-ghost" @click="toggleTheme">
    <Icon :name="isDark ? 'ph:sun' : 'ph:moon'" class="w-5 h-5" />
  </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>`