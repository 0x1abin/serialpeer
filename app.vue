`<template>
  <div class="min-h-screen bg-base-100" :data-theme="colorMode.value">
    <div class="container mx-auto p-4">
      <header class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Web Serial Debug</h1>
        <ColorModeButton />
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-4">
          <SerialConnect />
          <QuickCommands />
        </div>
        
        <div class="md:col-span-2 space-y-4">
          <SerialMonitor />
          <SerialSender />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const colorMode = useColorMode()
</script>`