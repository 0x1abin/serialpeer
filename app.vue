<template>
  <div class="min-h-screen bg-base-100" :data-theme="colorMode.value">
    <div class="container mx-auto p-4">
      <header class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Web Serial Debug</h1>
        <ColorModeButton />
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-2">
        <div class="space-y-2">
          <SerialConnect />
          <QuickCommands />
        </div>
        
        <div class="space-y-2">
          <SerialMonitor />
          <SerialSender />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
</script>