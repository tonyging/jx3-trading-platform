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
      // 更新為新的推薦寫法
      optimizer: {
        web: {
          include: ['vue'],
        },
      },
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/compiled/**'],
    // 保留 root 設定
    root: path.resolve(__dirname),
    // 使用正確的屬性名稱
    testTransformMode: {
      web: ['.[jt]sx?$'], // 使用字串格式而非正則表達式
    },
  },
})
