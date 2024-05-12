// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'PomoCraft'
    }
  },
  devtools: { enabled: true },
  modules: ["@nuxt/ui"]
})