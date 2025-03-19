// services/api/admin.ts
import api from './index'
import type { User, Product, Transaction } from '@/types'

// 管理員 API 響應介面
interface AdminStatsResponse {
  status: string
  data: {
    totalUsers: number
    totalProducts: number
    activeProducts: number
    totalTransactions: number
    completedTransactions: number
  }
}

interface UsersResponse {
  status: string
  data: {
    users: User[]
    pagination: {
      current: number
      total: number
      totalRecords: number
    }
  }
}

interface ProductsResponse {
  status: string
  data: {
    products: Product[]
    pagination: {
      current: number
      total: number
      totalRecords: number
    }
  }
}

interface TransactionsResponse {
  status: string
  data: {
    transactions: Transaction[]
    pagination: {
      current: number
      total: number
      totalRecords: number
    }
  }
}

interface UpdateRoleRequest {
  role: 'user' | 'admin' | 'banned'
  banDuration?: number
  banReason?: string
}

// 管理員相關 API
export const adminApi = {
  // 獲取儀表板統計數據
  getStats: async () => {
    const response = await api.get<AdminStatsResponse>('/api/admin/stats')
    return response.data
  },

  // 獲取最近用戶列表
  getRecentUsers: async (params?: { page?: number; limit?: number; query?: string }) => {
    const response = await api.get<UsersResponse>('/api/admin/users', { params })
    return response.data
  },

  // 獲取用戶詳情
  getUserDetail: async (userId: string) => {
    const response = await api.get<{ status: string; data: User }>(`/api/admin/users/${userId}`)
    return response.data
  },

  // 獲取最近商品列表
  getRecentProducts: async (params?: {
    page?: number
    limit?: number
    query?: string
    status?: string
  }) => {
    const response = await api.get<ProductsResponse>('/api/admin/products', { params })
    return response.data
  },

  // 獲取最近交易列表
  getRecentTransactions: async (params?: {
    page?: number
    limit?: number
    query?: string
    status?: string
  }) => {
    const response = await api.get<TransactionsResponse>('/api/admin/transactions', { params })
    return response.data
  },

  // 更新用戶角色
  updateUserRole: async (userId: string, data: UpdateRoleRequest) => {
    const response = await api.patch<{ status: string; message: string }>(
      `/api/users/role/${userId}`,
      data,
    )
    return response.data
  },

  // 刪除商品 (管理員可以刪除任何商品)
  deleteProduct: async (productId: string) => {
    const response = await api.delete<{ status: string; message: string }>(
      `/api/products/${productId}`,
    )
    return response.data
  },

  // 搜尋用戶
  searchUsers: async (query: string, page: number = 1, limit: number = 10) => {
    const response = await api.get<UsersResponse>('/api/admin/users/search', {
      params: { query, page, limit },
    })
    return response.data
  },

  // 搜尋商品
  searchProducts: async (query: string, page: number = 1, limit: number = 10) => {
    const response = await api.get<ProductsResponse>('/api/admin/products/search', {
      params: { query, page, limit },
    })
    return response.data
  },

  // 搜尋交易
  searchTransactions: async (query: string, page: number = 1, limit: number = 10) => {
    const response = await api.get<TransactionsResponse>('/api/admin/transactions/search', {
      params: { query, page, limit },
    })
    return response.data
  },

  // 獲取系統日誌
  getSystemLogs: async (page: number = 1, limit: number = 20) => {
    const response = await api.get<{
      status: string
      data: {
        logs: {
          id: string
          type: string
          action: string
          userId?: string
          details: string
          ip?: string
          createdAt: string
        }[]
        pagination: {
          current: number
          total: number
          totalRecords: number
        }
      }
    }>('/api/admin/logs', { params: { page, limit } })
    return response.data
  },
}
