<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto p-4">
      <AppHeader />

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