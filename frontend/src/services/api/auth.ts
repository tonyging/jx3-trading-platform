import api from './index'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    username: string
  }
}

export const authApi = {
  // 登入
  login: (credentials: LoginCredentials) => api.post<LoginResponse>('/auth/login', credentials),

  // 註冊
  register: (userData: LoginCredentials & { username: string }) =>
    api.post('/auth/register', userData),

  // 取得當前用戶資料
  getCurrentUser: () => api.get('/auth/me'),
}
