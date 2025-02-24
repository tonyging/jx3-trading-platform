<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  const { token, email, name } = route.query

  if (token && email && name) {
    try {
      // 將 token 存儲到 localStorage 或 Pinia store
      userStore.setUser({
        token: token as string,
        email: email as string,
        name: name as string,
      })

      // 可以在這裡進行一些額外的用戶信息獲取或初始化

      // 導航到主頁或儀表板
      router.push('/')
    } catch (error) {
      console.error('Google 登入處理失敗:', error)
      router.push('/auth/google/error')
    }
  } else {
    // 如果缺少必要的參數
    router.push('/login')
  }
})
</script>

<template>
  <div>登入處理中...</div>
</template>
