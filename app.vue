<template>
  <div class="min-h-screen bg-base-100" :data-theme="colorMode.value">
    <div class="container mx-auto p-4">
      <header class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Web Serial Debug</h1>
        <ColorModeButton />
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div class="space-y-3">
          <SerialConnect />
          <QuickCommands />
          <TimedCommands />
          <LogRecords />
        </div>
        
        <div class="lg:col-span-3 space-y-3">
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