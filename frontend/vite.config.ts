import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
})
