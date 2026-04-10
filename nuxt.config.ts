import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-04-07',
  devtools: { enabled: true },
  modules: ['shadcn-nuxt', 'notivue/nuxt'],
  css: [
    '~/assets/css/tailwind.css',
    'notivue/notification.css',
    'notivue/animations.css',
  ],
  notivue: {
    position: 'top-center',
    limit: 3,
    enqueue: false,
    pauseOnHover: true,
    notifications: {
      global: {
        duration: 3000,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@popperjs/core',
        '@vue-flow/core',
        '@vue-flow/background',
        '@vue-flow/minimap',
        'fuse.js',
        'lucide-vue-next',
      ],
    },
  },
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  typescript: {
    strict: true,
  },
  ssr: false,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Avorion Manufactory Helper',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [],
    },
  },
})
