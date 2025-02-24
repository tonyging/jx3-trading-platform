<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const handleLogout = async () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- 導航欄 -->
    <nav class="bg-white shadow">
      <div class="container mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex">
            <!-- Logo -->
            <router-link to="/" class="flex items-center">
              <span class="text-xl font-bold text-gray-900">JX3 Trading</span>
            </router-link>
          </div>

          <!-- 導航菜單 -->
          <div class="flex items-center">
            <template v-if="userStore.isAuthenticated">
              <router-link to="/profile" class="text-gray-700 hover:text-gray-900 px-3 py-2">
                個人資料
              </router-link>
              <button @click="handleLogout" class="text-gray-700 hover:text-gray-900 px-3 py-2">
                登出
              </button>
            </template>
            <template v-else>
              <router-link to="/login" class="text-gray-700 hover:text-gray-900 px-3 py-2">
                登入
              </router-link>
              <router-link to="/register" class="text-gray-700 hover:text-gray-900 px-3 py-2">
                註冊
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要內容區域 -->
    <main class="flex-1">
      <slot></slot>
    </main>

    <!-- 頁尾 -->
    <footer class="bg-gray-100">
      <div class="container mx-auto px-4 py-6">
        <p class="text-center text-gray-600">© 2024 JX3 Trading Platform. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
