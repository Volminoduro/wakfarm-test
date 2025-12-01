import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Permet d'utiliser @ pour pointer vers /src
    },
  },
  // TRES IMPORTANT : Remplace 'Wakfarm' par le nom EXACT de ton repository GitHub.
  // Si ton repo s'appelle 'wakfarm-project', mets '/wakfarm-project/'.
  base: '/wakfarm-test/', 
})