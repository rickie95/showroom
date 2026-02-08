import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // o 'jsdom' se testi componenti web
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'], // Cerca solo dentro /tests
  },
  resolve: {
    alias: {
      // Questo permette di usare '@' come scorciatoia per la cartella 'src'
      '@': path.resolve(__dirname, './src'),
    },
  },
})