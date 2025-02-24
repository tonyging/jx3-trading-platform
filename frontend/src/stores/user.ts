import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userService } from '@/services/api/user'
import type { User, LoginCredentials } from '@/types/user'

interface RegisterCredentials {
  name: string
  email: string
  password: string
}

// 定義 store，使用組合式 API 風格
export const useUserStore = defineStore(
  'user',
  () => {
    // 使用 ref 來追蹤狀態
    const currentUser = ref<User | null>(null)
    const token = ref<string | null>(localStorage.getItem('token'))
    const loading = ref(false)
    const error = ref<string | null>(null)

    // 使用 computed 來建立計算屬性
    const isAuthenticated = computed(() => !!token.value)

    // 註冊動作
    async function register(userData: RegisterCredentials) {
      // 設置載入狀態和清除任何先前的錯誤
      loading.value = true
      error.value = null

      try {
        const response = await userService.register(userData)

        return response
      } catch (err: any) {
        // 處理註冊錯誤
        error.value = err.response?.data?.message || '註冊失敗，請稍後再試'
        throw error.value
      } finally {
        // 重置載入狀態
        loading.value = false
      }
    }

    // 登入動作
    async function login(credentials: LoginCredentials) {
      loading.value = true
      error.value = null

      try {
        const response = await userService.login(credentials)
        if (response.status === 'success' && response.data) {
          token.value = response.data.token
          currentUser.value = response.data.user
          console.log('currentUser的值', currentUser.value)
          localStorage.setItem('token', response.data.token)
          return response
        } else {
          throw new Error('登入響應格式錯誤')
        }
      } catch (err: any) {
        error.value = err.response?.data?.message || '登入失敗，請稍後再試'
        throw error.value
      } finally {
        loading.value = false
      }
    }

    // 登出動作
    function logout() {
      // 清除所有用戶相關的狀態
      token.value = null
      currentUser.value = null
      localStorage.removeItem('token')
    }

    // 取得當前用戶資料
    async function fetchCurrentUser() {
      console.log('開始獲取用戶資訊', token.value ? '有 token' : '無 token')
      if (!token.value) {
        console.log('無 token，中止獲取用戶資訊')
        return null
      }

      try {
        const userData = await userService.getProfile()
        console.log('成功獲取用戶資訊', userData.data)

        if (userData) {
          // 顯式轉換為 User 型別
          const userDataWithRole: User = {
            id: userData.data.id,
            email: userData.data.email,
            name: userData.data.name,
            role: userData.data.role || 'user', // 提供預設值
            createdAt: userData.data.createdAt,
          }

          currentUser.value = userDataWithRole
          return userData
        } else {
          console.warn('獲取的用戶資訊為空')
          logout()
          return null
        }
      } catch (err) {
        console.error('獲取用戶資訊失敗:', err)
        logout()
        return null
      }
    }

    // 獲取 Google 登入 URL
    async function getGoogleAuthUrl() {
      try {
        loading.value = true
        error.value = null
        const response = await userService.getGoogleAuthUrl()
        return response.url
      } catch (err: any) {
        error.value = err.response?.data?.message || '獲取 Google 登入連結失敗'
        throw error.value
      } finally {
        loading.value = false
      }
    }

    // Google 登入處理
    async function handleGoogleLogin(tokenId: string) {
      loading.value = true
      error.value = null

      try {
        const response = await userService.googleLogin(tokenId)
        if (response.status === 'success' && response.data) {
          token.value = response.data.token
          currentUser.value = response.data.user
          localStorage.setItem('token', response.data.token)
          return response
        } else {
          throw new Error('Google 登入響應格式錯誤')
        }
      } catch (err: any) {
        error.value = err.response?.data?.message || 'Google 登入失敗'
        throw error.value
      } finally {
        loading.value = false
      }
    }

    // 處理 Google 登入回調
    async function handleGoogleCallback(code: string) {
      loading.value = true
      error.value = null

      try {
        const response = await userService.handleGoogleCallback(code)
        if (response.status === 'success' && response.data) {
          token.value = response.data.token
          currentUser.value = response.data.user
          localStorage.setItem('token', response.data.token)
          return response
        } else {
          throw new Error('Google 登入回調處理失敗')
        }
      } catch (err: any) {
        error.value = err.response?.data?.message || 'Google 登入回調處理失敗'
        throw error.value
      } finally {
        loading.value = false
      }
    }

    // 發送重設密碼驗證碼
    async function sendPasswordResetCode(data: { email: string }) {
      loading.value = true
      error.value = null

      try {
        const response = await userService.sendPasswordResetCode(data)
        return response
      } catch (err: any) {
        console.error('發送驗證碼錯誤:', err)
        if (err.response?.data?.message) {
          error.value = err.response.data.message
          throw new Error(err.response.data.message)
        } else {
          error.value = '發送驗證碼失敗，請稍後再試'
          throw new Error('發送驗證碼失敗，請稍後再試')
        }
      } finally {
        loading.value = false
      }
    }

    // 驗證重設密碼驗證碼
    async function verifyPasswordResetCode(data: { email: string; code: string }) {
      loading.value = true
      error.value = null

      try {
        const response = await userService.verifyPasswordResetCode(data)
        return response
      } catch (err: any) {
        error.value = err.response?.data?.message || '驗證碼驗證失敗'
        throw error.value
      } finally {
        loading.value = false
      }
    }

    // 使用驗證碼重設密碼
    async function resetPassword(data: { email: string; code: string; newPassword: string }) {
      loading.value = true
      error.value = null

      try {
        const response = await userService.resetPasswordWithCode(data)
        return response
      } catch (err: any) {
        error.value = err.response?.data?.message || '重設密碼失敗'
        throw error.value
      } finally {
        loading.value = false
      }
    }

    // 返回所有需要在組件中使用的狀態和方法
    return {
      currentUser,
      token,
      loading,
      error,
      isAuthenticated,
      login,
      logout,
      fetchCurrentUser,
      register,
      getGoogleAuthUrl,
      handleGoogleLogin,
      handleGoogleCallback,
      verifyPasswordResetCode,
      resetPassword,
      sendPasswordResetCode,
    }
  },
  {
    persist: true, // 啟用持久化
  },
)
