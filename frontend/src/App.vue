<!-- App.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/appState'
import axios from 'axios'

const userStore = useUserStore()
const appStore = useAppStore()

async function preWarmBackend() {
  try {
    appStore.setBackendWaking(true)
    appStore.incrementConnectionAttempts()

    await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/health`, {
      timeout: 10000, // 10 秒超時
    })

    appStore.setBackendWaking(false)
    appStore.resetConnectionAttempts()
  } catch (error) {
    console.log('正在喚醒後端服務...', error)

    // 5 秒後重試
    setTimeout(() => {
      if (appStore.connectionAttempts < 5) {
        // 最多嘗試 5 次
        preWarmBackend()
      } else {
        appStore.setBackendWaking(false)
      }
    }, 5000)
  }
}

onMounted(async () => {
  preWarmBackend()
  if (userStore.token && !userStore.currentUser) {
    try {
      await userStore.fetchCurrentUser()
    } catch (error) {
      console.error('Failed to load user info:', error)
    }
  }
})
</script>

<template>
  <router-view />

  <!-- 全局加載指示器 -->
  <div v-if="appStore.isBackendWaking" class="backend-waking-overlay">
    <div class="loading-spinner"></div>
    <p class="waking-message">正在連接到伺服器，這可能需要幾秒鐘...</p>
    <p class="waking-submessage">
      我們使用免費的雲服務，首次連接可能較慢
      <span v-if="appStore.connectionAttempts > 1">
        (嘗試第 {{ appStore.connectionAttempts }} 次)
      </span>
    </p>
  </div>
</template>

<style>
/* 重置所有元素的默認樣式，確保一致的基礎外觀 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 設置基本的字體和文字樣式 */
body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
    'Helvetica Neue', sans-serif;
  line-height: 1.5;
  color: #202123;
}

/* 確保整個應用容器佔滿視窗高度 */
#app {
  min-height: 100vh;
}

.backend-waking-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
  font-family: Arial, sans-serif;
}

.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid white;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.waking-message {
  font-size: 20px;
  margin-bottom: 10px;
}

.waking-submessage {
  font-size: 14px;
  opacity: 0.8;
}
</style>
