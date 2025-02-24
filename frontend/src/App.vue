<!-- App.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(async () => {
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
</style>
