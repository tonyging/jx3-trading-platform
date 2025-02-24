// services/api/product.ts
import api from './index'
import { TransactionResponse } from './transaction'

// 請求和響應的類型定義
export interface CreateProductRequest {
  amount: number
  price: number
}

// 根據後端模型定義 Product 介面
export interface Product {
  _id: string // MongoDB 的 id 使用 _id
  userId: string // ObjectId 在前端以字符串形式表示
  amount: number
  price: number
  ratio: number
  status: 'active' | 'reserved' | 'sold' | 'deleted'
  createdAt: string
  updatedAt: string
  seller?: {
    // 當 populate 時會出現的賣家資訊
    name: string
    email: string
    contactInfo: {
      line?: string
      discord?: string
      facebook?: string
    }
  }
}

// API 響應的介面定義
export interface ProductResponse {
  status: string
  data: {
    product: Product
  }
}

export interface ProductListResponse {
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

// 商品相關的 API
export const productApi = {
  // 獲取商品列表 - 公開 API
  getProducts: async (params?: {
    page?: number
    limit?: number
    sortBy?: string
    order?: 'asc' | 'desc'
    tab?: 'all' | 'my' | 'trading' | 'admin'
    userId?: string // 新增可選的使用者ID參數
  }) => {
    const response = await api.get<ProductListResponse>('/api/products', {
      params,
    })
    return response.data
  },

  // 創建商品 - 需要認證
  createProduct: async (data: CreateProductRequest) => {
    const response = await api.post<ProductResponse>('/api/products', data)
    return response.data
  },

  // 保留商品 - 需要認證
  reserveProduct: async (productId: string, amount: number) => {
    const response = await api.post<TransactionResponse>(`/api/products/${productId}/reserve`, {
      amount,
    })
    return response.data
  },

  // 更新商品 - 需要認證
  updateProduct: async (
    id: string,
    data: Partial<CreateProductRequest & { status: Product['status'] }>,
  ) => {
    const response = await api.patch<ProductResponse>(`/api/products/${id}`, data)
    return response.data
  },

  // 刪除商品 - 需要認證
  deleteProduct: async (id: string) => {
    const response = await api.delete<ProductResponse>(`/api/products/${id}`)
    return response.data
  },
}
