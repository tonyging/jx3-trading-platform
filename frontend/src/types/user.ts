export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'banned'
  createdAt?: Date
  // 其他用戶資料欄位
}

export interface UserResponse {
  status: string
  data: {
    id: string
    email: string
    name: string
    role: 'admin' | 'user' | 'banned'
    createdAt: Date
  }
}

export interface LoginResponse {
  status: string
  data: {
    token: string
    user: {
      id: string
      email: string
      name: string
    }
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

export interface UpdateProfileData {
  name: string
  // 其他可更新的資料欄位
}

export interface UpdatePasswordData {
  currentPassword: string
  newPassword: string
}

export interface ResetPasswordData {
  token: string
  newPassword: string
}

export interface LoginHistoryEntry {
  timestamp: Date
  ipAddress: string
  deviceInfo: string
}

export interface ErrorResponse {
  status: string
  message: string
  // 可能還有其他錯誤相關的詳細信息
}

// 添加 Google 認證回應的介面
export interface GoogleAuthResponse {
  status: string
  data: {
    token: string
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'user' | 'banned'
      createdAt?: Date
    }
  }
}

// 添加 Google 使用者資料的介面
export interface GoogleUserData {
  email: string
  name: string
  googleId: string
  picture?: string
}
