import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.git/**',
      '**/auto-imports.d.ts',
      '**/components.d.ts',
      'public/**',
      '.vscode/**',
      '.husky/**',
      '.github/**',
      'README.md',
      'index.html',
      'package.json',
      'package-lock.json',
      'tsconfig*.json',
      'vite.config.ts',
      'vitest.config.ts',
      'postcss.config.js',
      '*.config.js',
      '*.setup.js',
      '**/compiled/**',
    ],
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },

  skipFormatting,

  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-components': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      'no-debugger': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'off',
    },
  },
)
