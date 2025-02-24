<!-- LoginView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 初始化路由和用戶狀態管理工具
const router = useRouter()
const userStore = useUserStore()

// 定義表單相關的響應式變數
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// 處理登入表單提交
async function handleLogin() {
  console.log('開始登入流程:', { email: email.value })
  // 驗證表單輸入
  if (!email.value || !password.value) {
    errorMessage.value = '請填寫所有必填欄位'
    return
  }

  // 設置載入狀態並清除錯誤訊息
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await userStore.login({
      email: email.value,
      password: password.value,
    })
    localStorage.setItem('shouldReload', 'true')
    router.push('/')
  } catch (error: any) {
    errorMessage.value = '登入失敗，請檢查您的帳號密碼'
  } finally {
    isLoading.value = false
  }
}

// 處理 Google 登入
async function handleGoogleLogin() {
  try {
    isLoading.value = true
    errorMessage.value = ''

    // 獲取 Google 登入 URL
    const url = await userStore.getGoogleAuthUrl() // 直接獲取 url
    window.location.href = url
  } catch (error) {
    errorMessage.value = '無法啟動 Google 登入'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="site-header">
      <h1>劍三交易平台</h1>
    </div>

    <div class="content-wrapper">
      <main class="main-content">
        <h2>歡迎回來</h2>

        <form @submit.prevent="handleLogin" class="login-form">
          <!-- 電子郵件輸入框 -->
          <div class="input-group">
            <input
              v-model="email"
              type="email"
              required
              placeholder="電子郵件地址"
              :class="{ error: errorMessage }"
            />
          </div>

          <!-- 密碼輸入框 -->
          <div class="input-group">
            <input
              v-model="password"
              type="password"
              required
              placeholder="密碼"
              :class="{ error: errorMessage }"
            />
            <div v-if="errorMessage" class="error-text">
              {{ errorMessage }}
            </div>
          </div>

          <!-- 忘記密碼連結 -->
          <div class="forgot-password">
            <router-link to="/forgot-password">忘記密碼？</router-link>
          </div>

          <!-- 登入按鈕 -->
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '處理中...' : '繼續' }}
          </button>

          <!-- 註冊提示 移到這裡 -->
          <div class="register-prompt">
            還沒有帳戶？
            <router-link to="/register">註冊</router-link>
          </div>

          <!-- 分隔線 -->
          <div class="divider">
            <span>或</span>
          </div>

          <!-- Google 登入按鈕 -->
          <button
            type="button"
            class="google-login-button"
            @click="handleGoogleLogin"
            :disabled="isLoading"
          >
            <img src="@/assets/google-icon.svg" alt="Google" />
            使用 Google 帳號登入
          </button>
        </form>
      </main>
    </div>
  </div>
</template>

<style lang="scss">
@use '@/styles/auth.scss';

.divider {
  position: relative;
  text-align: center;
  margin: 8px 0;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: calc(50% - 30px);
    height: 1px;
    background-color: #e0e0e0;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  span {
    background-color: white;
    padding: 0 10px;
    color: #666;
    font-size: 14px;
    position: relative;
    z-index: 1;
  }
}

.google-login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #333333;
  border: 1px solid #dddddd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  img {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background-color: #f8f8f8;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.register-prompt {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  color: #333;

  a {
    color: #d32f2f; // 與其他錯誤或強調文字相同的紅色
    text-decoration: none;
    font-weight: 600;
  }
}
</style>
