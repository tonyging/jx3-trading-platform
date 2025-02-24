<!-- src/views/GoogleCallback.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  try {
    const code = route.query.code as string
    if (!code) {
      throw new Error('未收到授權碼')
    }

    await userStore.handleGoogleCallback(code)
    router.push('/')
  } catch (error) {
    console.error('Google 登入失敗:', error)
    router.push('/auth/google/error')
  }
})
</script>

<template>
  <div class="google-callback">
    <div class="loading-spinner">登入中...</div>
  </div>
</template>

<style scoped>
.google-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.loading-spinner {
  font-size: 1.2rem;
  color: #666;
}
</style>
