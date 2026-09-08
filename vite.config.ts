import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

function githubPagesSpaFallback() {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const index = resolve('dist/index.html')
      const fallback = resolve('dist/404.html')
      if (existsSync(index)) {
        copyFileSync(index, fallback)
      }
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Lorebound/' : '/',
  plugins: [react(), githubPagesSpaFallback()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
