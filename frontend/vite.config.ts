import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import VueMacros from 'unplugin-vue-macros/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    VueMacros({
      plugins: {
        vue: vue(),
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/uploads': {
        target: process.env.BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, '/uploads'),
      },
    },
  },
  build: {
    outDir: 'dist', // 建置輸出目錄
    sourcemap: false, // 可選：不生成 sourcemap
    rollupOptions: {
      output: {
        // 客製化輸出配置
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    deps: {
      optimizer: {
        web: {
          include: ['vue'],
        },
      },
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/compiled/**'],
    root: path.resolve(__dirname),
    testTransformMode: {
      web: ['.[jt]sx?$'],
    },
  },
})
