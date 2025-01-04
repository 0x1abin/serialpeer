<template>
  <header class="flex justify-between items-center mb-4">
    <div class="flex items-center gap-3">
      <img src="/public/logo.svg" alt="SerialPeer Logo" class="w-8 h-8" />
      <h1 class="text-2xl font-bold">Serial Peer</h1>
      <span class="text-sm text-gray-500">v{{ version }}</span>
    </div>
    <ColorModeButton />
  </header>
</template>

<script setup lang="ts">
const version = import.meta.env.VITE_APP_VERSION
</script>
