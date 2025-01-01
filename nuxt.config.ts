export default defineNuxtConfig({
  ssr: false,
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'nuxt-icon'
  ],

  colorMode: {
    classSuffix: '',
    fallback: 'light',
    preference: 'system',
    dataValue: 'theme',
    storageKey: 'nuxt-color-mode'
  },

  app: {
    head: {
      title: 'Web Serial Debug',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  compatibilityDate: '2024-12-30',

  build: {
    transpile: ['idb']
  }
})