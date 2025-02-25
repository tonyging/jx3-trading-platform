// services/api/product.ts
import api from './index'
import type {
  TransactionResponse,
  ProductStatus,
  ProductResponse,
  ProductListResponse,
  ProductListType,
} from '@/types'

// 請求型別定義
export interface CreateProductRequest {
  amount: number
  price: number
}

// 商品相關的 API
export const productApi = {
  // 獲取商品列表 - 公開 API
  getProducts: async (params?: {
    page?: number
    limit?: number
    sortBy?: string
    order?: 'asc' | 'desc'
    tab?: ProductListType
    userId?: string
    status?: ProductStatus | ProductStatus[]
    buyerId?: string
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
    data: Partial<{
      amount: number
      price: number
      status: ProductStatus
    }>,
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
