// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'PomoCraft'
    }
  },
  devtools: { enabled: false },
  modules: ["@nuxt/ui", "@nuxt/image"],
  css: ['~/assets/styles/tailwind.css'],
})
