import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: process.env.NODE_ENV === 'production' ? '/heic-to-jpg-converter/' : '/'
})