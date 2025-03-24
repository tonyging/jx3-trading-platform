// src/stores/appState.ts
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    isBackendWaking: false,
    connectionAttempts: 0,
    // 側邊欄狀態
    isSidebarCollapsed: false,
  }),
  actions: {
    setBackendWaking(status: boolean) {
      this.isBackendWaking = status
    },
    incrementConnectionAttempts() {
      this.connectionAttempts++
    },
    resetConnectionAttempts() {
      this.connectionAttempts = 0
    },
    // 側邊欄相關方法
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
    setSidebarCollapsed(status: boolean) {
      this.isSidebarCollapsed = status
    },
  },
})
