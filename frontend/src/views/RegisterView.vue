<!-- src/views/RegisterView.vue -->
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from 'axios'
import { userService } from '@/services/api/user'

const router = useRouter()
const userStore = useUserStore()

// 定義註冊流程的不同階段
enum RegisterStage {
  EmailPassword,
  VerificationCode,
  UserName,
}

// 使用響應式狀態管理整個註冊過程
const currentStage = ref(RegisterStage.EmailPassword)
const formData = reactive({
  email: '',
  password: '',
  verificationCode: '',
  name: '',
})

const errorMessage = ref('')
const isLoading = ref(false)

// 第一階段 - 郵箱與密碼驗證
const validateEmailPassword = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!formData.email) {
    errorMessage.value = '請輸入電子郵件'
    return false
  }

  if (!emailRegex.test(formData.email)) {
    errorMessage.value = '請輸入有效的電子郵件地址'
    return false
  }

  if (!formData.password) {
    errorMessage.value = '請輸入密碼'
    return false
  }

  if (formData.password.length < 8) {
    errorMessage.value = '密碼長度至少需要8個字符'
    return false
  }

  return true
}

// 發送驗證碼
const sendVerificationCode = async () => {
  if (!validateEmailPassword()) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    console.log('Attempting to send verification code with:', {
      email: formData.email,
      passwordLength: formData.password.length,
    })

    const response = await userService.sendVerificationCode({
      email: formData.email,
      password: formData.password,
    })

    console.log('Verification code send response:', response)

    currentStage.value = RegisterStage.VerificationCode
  } catch (error: any) {
    console.log('error', error)
    errorMessage.value = error || '發送驗證碼失敗'
  } finally {
    isLoading.value = false
  }
}

// 驗證碼驗證
const verifyCode = async () => {
  if (!formData.verificationCode) {
    errorMessage.value = '請輸入驗證碼'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await userService.verifyCode({
      email: formData.email,
      code: formData.verificationCode,
    })

    currentStage.value = RegisterStage.UserName
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || '驗證碼錯誤'
  } finally {
    isLoading.value = false
  }
}

// 完成註冊
const completeRegistration = async () => {
  if (!formData.name) {
    errorMessage.value = '請輸入使用者名稱'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await userService.completeRegistration({
      email: formData.email,
      name: formData.name,
    })

    // 自動登入並跳轉到主頁
    await userStore.login({
      email: formData.email,
      password: formData.password,
    })

    router.push('/')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || '註冊失敗'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="content-wrapper">
      <main class="main-content">
        <!-- 動態標題 -->
        <h2 v-if="currentStage === RegisterStage.EmailPassword">建立帳戶</h2>
        <h2 v-else-if="currentStage === RegisterStage.VerificationCode">查看你的收件匣</h2>
        <h2 v-else-if="currentStage === RegisterStage.UserName">你的稱呼</h2>

        <!-- 第一階段：郵箱與密碼 -->
        <form
          v-if="currentStage === RegisterStage.EmailPassword"
          @submit.prevent="sendVerificationCode"
          class="login-form"
        >
          <div class="input-group">
            <input
              v-model="formData.email"
              type="email"
              required
              placeholder="電子郵件地址"
              :class="{ error: errorMessage }"
            />
          </div>

          <div class="input-group">
            <input
              v-model="formData.password"
              type="password"
              required
              placeholder="密碼"
              :class="{ error: errorMessage }"
            />
          </div>

          <div v-if="errorMessage" class="error-text">
            {{ errorMessage }}
          </div>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '發送中...' : '繼續' }}
          </button>
        </form>

        <!-- 第二階段：驗證碼 -->
        <form
          v-else-if="currentStage === RegisterStage.VerificationCode"
          @submit.prevent="verifyCode"
          class="login-form"
        >
          <p class="verification-subtitle">請輸入我們傳送到 {{ formData.email }} 的驗證碼。</p>

          <div class="input-group">
            <input
              v-model="formData.verificationCode"
              type="text"
              required
              placeholder="驗證碼"
              :class="{ error: errorMessage }"
            />
          </div>

          <div v-if="errorMessage" class="error-text">
            {{ errorMessage }}
          </div>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '驗證中...' : '繼續' }}
          </button>
        </form>

        <!-- 第三階段：使用者名稱 -->
        <form
          v-else-if="currentStage === RegisterStage.UserName"
          @submit.prevent="completeRegistration"
          class="login-form"
        >
          <div class="input-group">
            <input
              v-model="formData.name"
              type="text"
              required
              placeholder="名稱"
              :class="{ error: errorMessage }"
            />
          </div>

          <div v-if="errorMessage" class="error-text">
            {{ errorMessage }}
          </div>

          <p class="terms-agreement">
            點選「繼續」，即表示你同意我們的<a href="#">條款</a>，並已閱讀我們的《隱私權政策》。
          </p>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '註冊中...' : '繼續' }}
          </button>
        </form>

        <!-- 返回登入的連結 -->
        <div v-if="currentStage === RegisterStage.EmailPassword" class="register-prompt">
          已經有帳號？
          <router-link to="/login">返回登入</router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<style lang="scss">
@use '@/styles/auth.scss';

.verification-subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.terms-agreement {
  text-align: center;
  color: #666;
  font-size: 0.8rem;
  margin-bottom: 15px;
  line-height: 1.5;

  a {
    color: #007bff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
