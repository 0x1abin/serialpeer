<template>
  <div class="dropdown dropdown-end dropdown-hover">
    <div role="button" class="btn btn-ghost btn-sm gap-1 normal-case">
      <Icon name="heroicons:language-solid" class="w-5 h-5" />
      <Icon name="heroicons:chevron-down" class="w-5 h-5 opacity-50" />
    </div>
    <ul class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-30">
      <li>
        <button 
          @click="setLocale('en')"
          :class="{ 'active': locale === 'en' }"
        >
          English
        </button>
      </li>
      <li>
        <button 
          @click="setLocale('zh')"
          :class="{ 'active': locale === 'zh' }"
        >
          中文
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n()
</script>

<style scoped>
.dropdown-content {
  min-width: 8rem;
}

.menu li > *:not(ul):not(.menu-title):not(details):active,
.menu li > *:not(ul):not(.menu-title):not(details).active,
.menu li > details > summary:active {
  background-color: hsl(var(--p) / 0.1);
  color: hsl(var(--p));
}

.menu :where(li:not(.menu-title):not(:empty)) > :where(:not(ul).active),
.menu :where(li:not(.menu-title):not(:empty)) > :where(*:not(ul):active) {
  background-color: hsl(var(--p) / 0.1);
  color: hsl(var(--p));
}
</style> 