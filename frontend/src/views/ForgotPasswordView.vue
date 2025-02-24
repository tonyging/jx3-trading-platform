<!-- ForgotPasswordView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 定義表單相關的響應式變數
const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// 定義當前步驟
const currentStep = ref(1) // 1: 輸入信箱, 2: 輸入驗證碼, 3: 重設密碼

// 檢查密碼是否匹配
const passwordsMatch = computed(() => {
  return newPassword.value === confirmPassword.value
})

// 處理發送驗證碼
async function handleSendVerification() {
  if (!email.value) {
    errorMessage.value = '請輸入電子郵件地址'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    console.log('準備發送驗證碼到:', email.value)

    const response = await userStore.sendPasswordResetCode({
      email: email.value,
    })

    console.log('發送驗證碼回應:', response)

    // 檢查回應是否成功
    if (response?.status === 'success') {
      successMessage.value = response.message || '驗證碼已發送到您的信箱'
      currentStep.value = 2
    } else {
      errorMessage.value = response?.message || '發送驗證碼失敗，請稍後再試'
    }
  } catch (error: any) {
    console.error('發送驗證碼時發生錯誤:', error)
    // 確保顯示完整的錯誤訊息
    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '發送驗證碼失敗，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

// 處理驗證碼確認
async function handleVerifyCode() {
  if (!verificationCode.value) {
    errorMessage.value = '請輸入驗證碼'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    console.log('準備驗證驗證碼:', { email: email.value, code: verificationCode.value })

    const response = await userStore.verifyPasswordResetCode({
      email: email.value,
      code: verificationCode.value,
    })

    console.log('驗證碼驗證回應:', response)

    if (response?.status === 'success') {
      currentStep.value = 3
    } else {
      errorMessage.value = response?.message || '驗證碼錯誤，請重新輸入'
    }
  } catch (error: any) {
    console.error('驗證碼驗證時發生錯誤:', error)
    errorMessage.value = error.response?.data?.message || error.message || '驗證碼錯誤，請重新輸入'
  } finally {
    isLoading.value = false
  }
}

// 處理密碼重設
async function handleResetPassword() {
  if (!newPassword.value || !confirmPassword.value) {
    errorMessage.value = '請填寫所有必填欄位'
    return
  }

  if (!passwordsMatch.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = '密碼長度至少需要 8 個字元'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    console.log('準備重設密碼:', { email: email.value })

    const response = await userStore.resetPassword({
      email: email.value,
      code: verificationCode.value,
      newPassword: newPassword.value,
    })

    console.log('重設密碼回應:', response)

    if (response?.status === 'success') {
      successMessage.value = response.message || '密碼重設成功！'
      // 只有在完全成功時才跳轉
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      errorMessage.value = response?.message || '重設密碼失敗，請稍後再試'
    }
  } catch (error: any) {
    console.error('重設密碼時發生錯誤:', error)
    errorMessage.value =
      error.response?.data?.message || error.message || '重設密碼失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- 模板部分保持不變 -->
  <div class="login-page">
    <div class="site-header">
      <h1>劍三交易平台</h1>
    </div>

    <div class="content-wrapper">
      <main class="main-content">
        <h2>重設密碼</h2>

        <!-- 步驟 1: 輸入信箱 -->
        <form v-if="currentStep === 1" @submit.prevent="handleSendVerification" class="login-form">
          <div class="input-group">
            <input
              v-model="email"
              type="email"
              required
              placeholder="請輸入您的電子郵件地址"
              :class="{ error: errorMessage }"
            />
            <div v-if="errorMessage" class="error-text">
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="success-text">
              {{ successMessage }}
            </div>
          </div>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '處理中...' : '發送驗證碼' }}
          </button>

          <div class="back-to-login">
            <router-link to="/login">返回登入</router-link>
          </div>
        </form>

        <!-- 步驟 2: 輸入驗證碼 -->
        <form v-if="currentStep === 2" @submit.prevent="handleVerifyCode" class="login-form">
          <div class="verification-message">
            驗證碼已發送至您的信箱：{{ email }}
            <div class="resend-link" @click="handleSendVerification">沒收到驗證碼？重新發送</div>
          </div>

          <div class="input-group">
            <input
              v-model="verificationCode"
              type="text"
              required
              placeholder="請輸入驗證碼"
              :class="{ error: errorMessage }"
            />
            <div v-if="errorMessage" class="error-text">
              {{ errorMessage }}
            </div>
          </div>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '驗證中...' : '驗證' }}
          </button>
        </form>

        <!-- 步驟 3: 重設密碼 -->
        <form v-if="currentStep === 3" @submit.prevent="handleResetPassword" class="login-form">
          <div class="input-group">
            <input
              v-model="newPassword"
              type="password"
              required
              placeholder="請輸入新密碼"
              :class="{ error: errorMessage }"
            />
          </div>

          <div class="input-group">
            <input
              v-model="confirmPassword"
              type="password"
              required
              placeholder="請再次輸入新密碼"
              :class="{ error: errorMessage }"
            />
            <div v-if="errorMessage" class="error-text">
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="success-text">
              {{ successMessage }}
            </div>
          </div>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '處理中...' : '重設密碼' }}
          </button>
        </form>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/auth.scss';

.verification-message {
  text-align: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #e3f2fd;
  border-radius: 8px;
  color: #1976d2;

  .resend-link {
    margin-top: 8px;
    font-size: 14px;
    color: #d32f2f;
    cursor: pointer;
    text-decoration: underline;

    &:hover {
      color: darken(#d32f2f, 10%);
    }
  }
}

.success-text {
  color: #4caf50;
  font-size: 14px;
  margin-top: 5px;
}

.back-to-login {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;

  a {
    color: #666;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
