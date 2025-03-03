// src/stores/appState.ts
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    isBackendWaking: false,
    connectionAttempts: 0,
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
  },
})
