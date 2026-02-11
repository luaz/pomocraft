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
      appVersion: "2.0.0",
    },
  },
  app: {
    head: {
      title: "PomoCraft",
    },
  },
  devtools: { enabled: false },
  modules: ["@nuxt/ui", "@nuxt/image"],
  css: ["~/assets/styles/tailwind.css"],
});
