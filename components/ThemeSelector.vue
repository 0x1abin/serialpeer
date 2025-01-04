<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <Icon name="mdi:palette-outline" class="w-5 h-5" />
    </label>
    <div
      tabindex="0"
      class="dropdown-content z-[1] p-3 shadow-2xl bg-base-100 rounded-box w-64 max-h-96 overflow-y-auto"
    >
      <div class="grid grid-cols-1 gap-3">
        <button
          v-for="theme in themes"
          :key="theme"
          :data-theme="theme"
          :data-set-theme="theme"
          @click="setTheme(theme)"
          class="w-full px-4 py-3 bg-base-100 hover:bg-base-100 rounded-xl flex items-center justify-between"
          :style="{ backgroundColor: getThemeBackground(theme) }"
        >
          <span 
            class="text-base-content"
            :class="{'font-medium': currentTheme === theme}"
          >
            {{ theme }}
            <Icon
              v-if="currentTheme === theme"
              name="mdi:check"
              class="w-4 h-4 inline-block ml-2"
            />
          </span>
          <div class="flex gap-1">
            <div 
              v-for="(color, index) in getThemeColors(theme)" 
              :key="index"
              class="w-2.5 h-6 rounded-full"
              :style="{ backgroundColor: color }"
            />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from '#app'
import { themeChange } from 'theme-change'
import { onMounted } from 'vue'

// Types
interface ThemeColors {
  [key: string]: string[]
}

// Constants
const SPECIAL_BACKGROUNDS = {
  dark: '#1d232a',
  synthwave: '#2d1b69',
  retro: '#e4d8b4'
} as const

const DEFAULT_BACKGROUND = 'white'
const DEFAULT_COLORS = ['#5921CF', '#FF2BC3', '#1AD1A5', '#1B1D1D']

// Theme colors configuration
const THEME_COLORS: ThemeColors = {
    light: ['#5921CF', '#FF2BC3', '#1AD1A5', '#1B1D1D'],
    dark: ['#793EF9', '#FF2BC3', '#1AD1A5', '#1B1D1D'],
    cupcake: ['#65C3C8', '#EF9FBC', '#EEAF3A', '#291334'],
    bumblebee: ['#F9D72F', '#F28C18', '#F6D860', '#1F1D2E'],
    emerald: ['#66CC8A', '#377CFB', '#EA8B8B', '#333C4D'],
    corporate: ['#4B6BFB', '#7B92B2', '#32D296', '#1F2937'],
    synthwave: ['#E779C1', '#58C7F3', '#F3CC30'],
    retro: ['#EF9995', '#A4CBB4', '#E6BA7E', '#2B3440'],
    valentine: ['#E96D7B', '#A991F7', '#FFB5E0', '#1F2937'],
    halloween: ['#F28C18', '#6B21A8', '#FF7AC6', '#1F2937'],
    garden: ['#5C7F67', '#ECB365', '#EC6F5B', '#1F2937'],
    forest: ['#1EB854', '#1DB88E', '#1D8EB8', '#1F2937'],
    aqua: ['#09ECF3', '#966FB3', '#2D9BF0', '#1F2937'],
    lofi: ['#808080', '#CACACA', '#4A4A4A', '#1F2937'],
    pastel: ['#D1C1D7', '#F6CBD1', '#B4E9D6', '#1F2937'],
    fantasy: ['#6E0B75', '#007A5E', '#8E7DCE', '#1F2937'],
    black: ['#333333', '#666666', '#999999', '#1F2937'],
    luxury: ['#F7C200', '#C0A062', '#44403C', '#1F2937'],
    dracula: ['#FF79C6', '#BD93F9', '#8BE9FD', '#1F2937'],
    autumn: ['#8C0327', '#D85251', '#F9B872', '#1F2937'],
    business: ['#1C4E80', '#7C909A', '#A6D4E3', '#1F2937'],
    acid: ['#FF00F4', '#FB37FF', '#FF1CF7', '#1F2937'],
    lemonade: ['#519903', '#E9E92E', '#7AA32A', '#1F2937'],
    night: ['#38BDF8', '#818CF8', '#C084FC', '#1F2937'],
    coffee: ['#DB924B', '#263E3F', '#4F3828', '#1F2937'],
    winter: ['#377CFB', '#00B5E2', '#4CC2FF', '#1F2937']
}

// Runtime config and state
const config = useRuntimeConfig()
const themes = config.public.themes
const currentTheme = useState('theme')

// Lifecycle hooks
onMounted(() => {
  initializeTheme()
})

// Methods
/**
 * Initialize theme from localStorage and setup theme change
 */
function initializeTheme() {
  themeChange(false)
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    currentTheme.value = savedTheme
  }
}

/**
 * Set the current theme and save to localStorage
 */
function setTheme(theme: string) {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
}

/**
 * Get the background color for a specific theme
 */
function getThemeBackground(theme: string): string {
  return SPECIAL_BACKGROUNDS[theme as keyof typeof SPECIAL_BACKGROUNDS] || DEFAULT_BACKGROUND
}

/**
 * Get the color dots for a specific theme
 */
function getThemeColors(theme: string): string[] {
  return THEME_COLORS[theme] || DEFAULT_COLORS
}
</script>

<style scoped>
/* Additional spacing for dropdown content */
.dropdown-content {
  @apply p-3;
}
</style> 