/*
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);
const appVersion = packageJson.version || "0.0.0";
 */
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      appVersion: "1.2.0",
    },
  },
  app: {
    head: {
      title: "PomoCraft",
    },
  },
  // Nuxt will detect cloudflare env: https://nuxt.com/deploy/cloudflare#git-integration
  // compatibilityDate: "2024-09-19",
  /*
  nitro: {
    preset: "cloudflare_pages",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    prerender: {
      autoSubfolderIndex: false,
    },
  },
   */
  devtools: { enabled: false },
  modules: ["@nuxt/ui", "@nuxt/image"],
  css: ["~/assets/styles/tailwind.css"],
});
