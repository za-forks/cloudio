// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  nitro: {
    vercel: {
      config: {
        runtime: 'nodejs20.x'
      }
    }
  },
    app: {
        head: {
          title: 'Alexa Radio',
          meta: [
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
          ],
        }
      },
    css: ["~/assets/css/styles.css"],
    modules: ['@nuxtjs/tailwindcss', '@nuxt/content'],
    build : {
      transpile: ['vue-toastification']
   },
   runtimeConfig: {
    // Private keys (server only)
    // Public keys (available in browser)
    public: {
      FIREBASE_API_KEY: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      FIREBASE_PROJECT_ID: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_APP_ID: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
    }
  }
})
