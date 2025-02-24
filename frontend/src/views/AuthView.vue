<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 控制顯示登入還是註冊表單
const isLogin = ref(true)

// 表單數據
const loginForm = ref({
  email: '',
  password: '',
})

const registerForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// 錯誤訊息
const errorMessage = ref('')
const isSubmitting = ref(false)

// 切換登入/註冊表單
const toggleForm = () => {
  isLogin.value = !isLogin.value
  errorMessage.value = '' // 清除錯誤訊息
}

// 處理登入
const handleLogin = async () => {
  if (!loginForm.value.email || !loginForm.value.password) {
    errorMessage.value = '請填寫所有必填欄位'
    return
  }

  isSubmitting.value = true
  try {
    await userStore.login(loginForm.value)
    router.push('/')
  } catch (error: any) {
    errorMessage.value = '登入失敗，請檢查您的帳號密碼'
  } finally {
    isSubmitting.value = false
  }
}

// 處理註冊
const handleRegister = async () => {
  if (
    !registerForm.value.name ||
    !registerForm.value.email ||
    !registerForm.value.password ||
    !registerForm.value.confirmPassword
  ) {
    errorMessage.value = '請填寫所有必填欄位'
    return
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  isSubmitting.value = true
  try {
    await userStore.register({
      name: registerForm.value.name,
      email: registerForm.value.email,
      password: registerForm.value.password,
    })
    isLogin.value = true // 註冊成功後切換到登入表單
    errorMessage.value = '註冊成功，請登入'
  } catch (error: any) {
    errorMessage.value = '註冊失敗，請稍後再試'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-[#1a1a1a] bg-opacity-90 py-12 px-4 sm:px-6 lg:px-8"
  >
    <!-- 背景圖片和遮罩 -->
    <div class="fixed inset-0 -z-10 bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a]"></div>

    <!-- 主要卡片容器 -->
    <div class="w-full max-w-md">
      <!-- 裝飾性標題 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-[#f0d587] mb-2 font-serif">劍俠情緣叁</h1>
        <p class="text-[#9a8866] text-lg">交易江湖</p>
      </div>

      <!-- 卡片主體 -->
      <div class="bg-[#2a2a2a] bg-opacity-95 p-8 rounded-lg shadow-xl border border-[#9a8866]">
        <!-- 表單切換按鈕 -->
        <div class="flex mb-8 border-b border-[#9a8866]">
          <button
            @click="toggleForm"
            :class="[
              'flex-1 py-2 text-lg font-medium transition-colors duration-200',
              isLogin
                ? 'text-[#f0d587] border-b-2 border-[#f0d587]'
                : 'text-[#9a8866] hover:text-[#f0d587]',
            ]"
          >
            登入
          </button>
          <button
            @click="toggleForm"
            :class="[
              'flex-1 py-2 text-lg font-medium transition-colors duration-200',
              !isLogin
                ? 'text-[#f0d587] border-b-2 border-[#f0d587]'
                : 'text-[#9a8866] hover:text-[#f0d587]',
            ]"
          >
            註冊
          </button>
        </div>

        <!-- 登入表單 -->
        <form v-if="isLogin" @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <input
              v-model="loginForm.email"
              type="email"
              required
              class="w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors"
              placeholder="電子郵件"
            />
          </div>
          <div>
            <input
              v-model="loginForm.password"
              type="password"
              required
              class="w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors"
              placeholder="密碼"
            />
          </div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3 bg-[#9a8866] hover:bg-[#f0d587] text-[#1a1a1a] rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
          >
            {{ isSubmitting ? '登入中...' : '登入' }}
          </button>
        </form>

        <!-- 註冊表單 -->
        <form v-else @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <input
              v-model="registerForm.name"
              type="text"
              required
              class="w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors"
              placeholder="使用者名稱"
            />
          </div>
          <div>
            <input
              v-model="registerForm.email"
              type="email"
              required
              class="w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors"
              placeholder="電子郵件"
            />
          </div>
          <div>
            <input
              v-model="registerForm.password"
              type="password"
              required
              class="w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors"
              placeholder="密碼"
            />
          </div>
          <div>
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              required
              class="w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors"
              placeholder="確認密碼"
            />
          </div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3 bg-[#9a8866] hover:bg-[#f0d587] text-[#1a1a1a] rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
          >
            {{ isSubmitting ? '註冊中...' : '註冊' }}
          </button>
        </form>

        <!-- 錯誤訊息 -->
        <div v-if="errorMessage" class="mt-4 text-red-400 text-center text-sm">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap');

/* 為標題使用江湖風格的字體 */
.font-serif {
  font-family: 'Ma Shan Zheng', serif;
}

/* 添加淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
