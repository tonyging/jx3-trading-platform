<!-- src/views/ProfileView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

// 定義可能的錯誤類型
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

const userStore = useUserStore()

// 用於存儲用戶資料的響應式變數
const username = ref('')
const email = ref('')
const isEditing = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 當元件載入時，從 store 中獲取用戶資料
onMounted(() => {
  if (userStore.currentUser) {
    username.value = userStore.currentUser.name
    email.value = userStore.currentUser.email
  }
})

// 處理資料更新
const handleUpdateProfile = async () => {
  try {
    // 這裡之後會加入更新用戶資料的邏輯
    // 方法1：使用完整的錯誤處理
    const updateProfile = async () => {
      // 假設這是一個未來會實現的更新邏輯
      // await userService.updateProfile({ name: username.value })
    }

    await updateProfile()
    isEditing.value = false
    successMessage.value = '個人資料更新成功'
  } catch (error: unknown) {
    // 方法2：完整的錯誤處理
    const apiError = error as ApiError
    errorMessage.value =
      apiError.response?.data?.message || (apiError.message as string) || '更新失敗，請稍後再試'

    // 可選：記錄完整的錯誤信息
    console.error('Profile update error:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow rounded-lg p-6">
        <!-- 頁面標題 -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">個人資料</h1>
          <p class="mt-1 text-sm text-gray-600">在這裡查看和管理您的個人資料</p>
        </div>

        <!-- 用戶資料表單 -->
        <div class="space-y-6">
          <!-- 用戶名稱 -->
          <div>
            <label class="block text-sm font-medium text-gray-700"> 用戶名稱 </label>
            <div class="mt-1">
              <input
                v-if="isEditing"
                v-model="username"
                type="text"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
              <p v-else class="py-2">{{ username }}</p>
            </div>
          </div>

          <!-- 電子郵件 -->
          <div>
            <label class="block text-sm font-medium text-gray-700"> 電子郵件 </label>
            <p class="py-2">{{ email }}</p>
          </div>

          <!-- 操作按鈕 -->
          <div class="flex justify-end space-x-3">
            <button
              v-if="!isEditing"
              @click="isEditing = true"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              編輯資料
            </button>
            <template v-else>
              <button
                @click="isEditing = false"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                取消
              </button>
              <button
                @click="handleUpdateProfile"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                儲存變更
              </button>
            </template>
          </div>

          <!-- 訊息顯示 -->
          <div v-if="errorMessage" class="mt-4 text-sm text-red-600">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="mt-4 text-sm text-green-600">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
