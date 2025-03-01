// src/services/api/index.ts
import axios from 'axios'

const api = axios.create({
  baseURL: (() => {
    console.log('Environment:', import.meta.env.MODE)
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  })(),
  timeout: 10000,
})

// 請求攔截器：重建 headers 對象並添加認證 token
api.interceptors.request.use(
  (config) => {
    // 保留原始的 headers 對象，但設置我們需要的屬性
    if (config.headers) {
      config.headers['Content-Type'] = 'application/json'
      config.headers['Accept'] = 'application/json'

      // 從 localStorage 獲取 token
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }

    console.log('發送請求:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
    })

    return config
  },
  (error) => {
    console.error('請求錯誤:', error)
    return Promise.reject(error)
  },
)

// 響應攔截器：處理各種響應情況
api.interceptors.response.use(
  (response) => {
    console.log('收到響應:', {
      status: response.status,
      data: response.data,
    })
    return response
  },
  (error) => {
    const errorMessage = error.response?.data?.message || '未知錯誤'
    console.error('響應錯誤:', {
      error: error,
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    })

    // 處理各種錯誤狀態
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 處理未授權錯誤
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('沒有權限')
          break
        case 404:
          console.error('資源不存在')
          break
        case 500:
          console.error('伺服器內部錯誤')
          break
        default:
          // 處理其他錯誤
          break
      }
    }

    return Promise.reject(errorMessage)
  },
)

export default api
