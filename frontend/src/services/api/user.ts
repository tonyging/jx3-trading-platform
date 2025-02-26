import api from './index'
import type {
  User,
  UserResponse,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileData,
  UpdatePasswordData,
  ResetPasswordData,
  LoginHistoryEntry,
  GoogleAuthResponse,
} from '@/types/user'

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

export const userService = {
  // 發送驗證碼的新方法
  sendVerificationCode: async (emailAndPassword: { email: string; password: string }) => {
    const response = await api.post('/api/users/send-verification', emailAndPassword)
    return response.data
  },

  // 驗證碼驗證的新方法
  verifyCode: async (data: { email: string; code: string }) => {
    const response = await api.post('/api/users/verify-code', data)
    return response.data
  },

  // 完成註冊的新方法
  completeRegistration: async (data: { email: string; name: string }) => {
    const response = await api.post('/api/users/complete-registration', data)
    return response.data
  },
  // 認證相關
  register: async (userData: RegisterCredentials) => {
    const response = await api.post<{ token: string; user: User }>('/api/users/register', userData)
    return response.data
  },

  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/api/users/login', credentials)
    return response.data // 現在 response.data 會包含完整的響應結構，包括 status
  },

  // 個人資料相關
  getProfile: async (): Promise<UserResponse> => {
    const response = await api.get<UserResponse>('/api/users/profile')
    return response.data
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserResponse> => {
    try {
      const response = await api.patch<UserResponse>('/api/users/profile', data)
      return response.data
    } catch (error: unknown) {
      const apiError = error as ApiError
      throw new Error(apiError.response?.data?.message || '更新個人資料失敗')
    }
  },

  // 密碼相關
  updatePassword: (data: UpdatePasswordData) => {
    return api.patch('/api/users/password', data)
  },

  forgotPassword: (email: string) => {
    return api.post('/api/users/forgotPassword', { email })
  },

  resetPassword: (token: string, data: ResetPasswordData) => {
    return api.patch(`/api/users/resetPassword/${token}`, data)
  },

  // 登入歷史
  getLoginHistory: () => {
    return api.get<LoginHistoryEntry[]>('/api/users/login-history')
  },

  // 帳號刪除
  deleteAccount: () => {
    return api.delete('/api/users/account')
  },

  // Google 登入相關
  getGoogleAuthUrl: async () => {
    const response = await api.get<{ url: string }>('/api/users/auth/google')
    return response.data
  },

  googleLogin: async (tokenId: string) => {
    const response = await api.post<GoogleAuthResponse>('/api/users/auth/google/login', {
      token: tokenId,
    })
    return response.data
  },

  handleGoogleCallback: async (code: string) => {
    const response = await api.get<GoogleAuthResponse>(
      `/api/users/auth/google/callback?code=${code}`,
    )
    return response.data
  },

  // 發送密碼重設驗證碼
  sendPasswordResetCode: async (data: { email: string }) => {
    try {
      console.log('發送請求到 /api/users/forgot-password/send-code:', data)
      const response = await api.post('/api/users/forgot-password/send-code', data)
      console.log('收到回應:', response.data)
      return response.data
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('API 錯誤:', apiError.response?.data || error)
      throw error
    }
  },

  // 驗證重設密碼的驗證碼
  verifyPasswordResetCode: async (data: { email: string; code: string }) => {
    const response = await api.post('/api/users/forgot-password/verify-code', data)
    return response.data
  },

  // 使用驗證碼重設密碼
  resetPasswordWithCode: async (data: { email: string; code: string; newPassword: string }) => {
    const response = await api.post('/api/users/forgot-password/reset', data)
    return response.data
  },

  // 更新手機號碼和驗證狀態
  updatePhoneNumber: async (phoneNumber: string, verificationId: string) => {
    try {
      const response = await api.post('/api/users/verify-phone', {
        phoneNumber,
        verificationId,
      })
      return response.data
    } catch (error: unknown) {
      const apiError = error as ApiError
      throw new Error(apiError.response?.data?.message || '驗證失敗')
    }
  },

  // 獲取手機驗證狀態
  getPhoneVerificationStatus: async () => {
    try {
      const response = await api.get('/api/users/phone-verification-status')
      return response.data
    } catch (error: unknown) {
      const apiError = error as ApiError
      throw new Error(apiError.response?.data?.message || '獲取驗證狀態失敗')
    }
  },
}
