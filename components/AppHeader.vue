<template>
  <header class="flex justify-between items-center mb-4">
    <div class="flex items-center gap-3">
      <img src="/public/logo.svg" alt="SerialPeer Logo" class="w-8 h-8" />
      <h1 class="text-2xl font-bold">Serial Peer</h1>
      <span class="text-sm text-gray-500">v{{ version }}</span>
    </div>
    <div class="flex items-center gap-">
        <ColorModeButton />
        <a
          href="https://github.com/0x1abin/serialpeer"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-circle"
          title="View on GitHub"
        >
          <Icon name="mdi:github" class="w-5 h-5" />
        </a>
    </div>
  </header>
</template>

<script setup lang="ts">
const version = import.meta.env.VITE_APP_VERSION
</script>
