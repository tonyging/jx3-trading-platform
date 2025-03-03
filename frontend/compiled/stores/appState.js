// src/stores/appState.ts
import { defineStore } from 'pinia';
export const useAppStore = defineStore('app', {
    state: () => ({
        isBackendWaking: false,
        connectionAttempts: 0,
    }),
    actions: {
        setBackendWaking(status) {
            this.isBackendWaking = status;
        },
        incrementConnectionAttempts() {
            this.connectionAttempts++;
        },
        resetConnectionAttempts() {
            this.connectionAttempts = 0;
        },
    },
});
//# sourceMappingURL=appState.js.map