import { defineConfig } from "vite";
import postcss from "./postcss.config.js";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), crossOriginIsolation()],
  css: { postcss },
});
