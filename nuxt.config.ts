import { defineNuxtConfig } from 'nuxt/config'
import pkg from './package.json'
import tailwindConfig from './tailwind.config'

export default defineNuxtConfig({
  ssr: false,
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'nuxt-icon',
    '@vite-pwa/nuxt',
    '@nuxtjs/i18n'
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
      title: 'SerialPeer',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SerialPeer - Modern Web Serial Debug Tool with P2P Sharing' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }
      ]
    }
  },

  compatibilityDate: '2024-12-30',

  build: {
    transpile: ['idb']
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'SerialPeer',
      short_name: 'SerialPeer',
      description: 'SerialPeer - Modern Web Serial Debug Tool with P2P Sharing',
      theme_color: '#ffffff',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      type: 'module'
    }
  },

  vite: {
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version)
    }
  },

  i18n: {
    langDir: 'locales',
    lazy: true,
    strategy: 'no_prefix',
    locales: [
      {
        code: 'en',
        file: 'en.json',
        name: 'English',
        iso: 'en-US'
      },
      {
        code: 'zh',
        file: 'zh.json',
        name: '中文',
        iso: 'zh-CN'
      },
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      fallbackLocale: 'en'
    }
  },

  tailwindcss: {
    config: {
      plugins: [require('daisyui')],
      daisyui: {
        themes: true,
        darkTheme: 'dark'
      }
    }
  },

  runtimeConfig: {
    public: {
      themes: tailwindConfig.daisyui.themes
    }
  }
})