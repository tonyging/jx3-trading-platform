// services/api/appearanceTrade.ts
import api from './index'
import { uploadImageToFirebase } from '@/firebase/storage'
import type {
  AppearanceTradeResponse,
  AppearanceTradeListResponse,
  CreateAppearanceTradeRequest,
  AppearanceTradeStatus,
  AppearancePaymentMethod,
} from '@/types/appearanceTrade'

// 外觀交易相關 API
export const appearanceTradeApi = {
  // 獲取外觀交易列表
  getAppearanceTrades: async (params?: {
    page?: number
    limit?: number
    sortBy?: string
    order?: 'asc' | 'desc'
    status?: AppearanceTradeStatus | AppearanceTradeStatus[]
    sellerId?: string
    buyerId?: string
    appearanceId?: string
    minPrice?: number
    maxPrice?: number
  }) => {
    const response = await api.get<AppearanceTradeListResponse>('/api/appearance-trades', {
      params,
    })
    return response.data
  },

  // 創建外觀交易
  createAppearanceTrade: async (data: CreateAppearanceTradeRequest) => {
    const response = await api.post<AppearanceTradeResponse>('/api/appearance-trades', data)
    return response.data
  },

  // 獲取交易詳情
  getAppearanceTradeById: async (id: string) => {
    const response = await api.get<AppearanceTradeResponse>(`/api/appearance-trades/${id}`)
    return response.data
  },

  // 預訂外觀交易
  reserveAppearanceTrade: async (id: string, paymentMethod: AppearancePaymentMethod) => {
    const response = await api.post<AppearanceTradeResponse>(
      `/api/appearance-trades/${id}/reserve`,
      {
        paymentMethod,
      },
    )
    return response.data
  },

  // 發送訊息
  sendMessage: async (id: string, content: string) => {
    const response = await api.post<AppearanceTradeResponse>(
      `/api/appearance-trades/${id}/messages`,
      {
        content,
      },
    )
    return response.data
  },

  // 上傳匯款證明 (使用 Firebase Storage)
  uploadPaymentProof: async (id: string, imageFile: File) => {
    try {
      const imagePath = `payment_proofs/${id}/${Date.now()}_${imageFile.name}`
      const imageUrl = await uploadImageToFirebase(imageFile, imagePath)

      // 將圖片 URL 提交到後端
      const response = await api.post<AppearanceTradeResponse>(
        `/api/appearance-trades/${id}/payment-proof`,
        { imageUrl },
      )

      return response.data
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },

  // 更新匯款證明 (直接傳入 URL)
  updatePaymentProof: async (id: string, imageUrl: string) => {
    const response = await api.post<AppearanceTradeResponse>(
      `/api/appearance-trades/${id}/payment-proof`,
      { imageUrl },
    )
    return response.data
  },

  // 賣家確認交易
  sellerConfirmTrade: async (id: string) => {
    const response = await api.post<AppearanceTradeResponse>(
      `/api/appearance-trades/${id}/seller-confirm`,
    )
    return response.data
  },

  // 買家確認交易
  buyerConfirmTrade: async (id: string) => {
    const response = await api.post<AppearanceTradeResponse>(
      `/api/appearance-trades/${id}/buyer-confirm`,
    )
    return response.data
  },

  // 取消交易
  cancelTrade: async (id: string, reason?: string) => {
    const response = await api.post<AppearanceTradeResponse>(
      `/api/appearance-trades/${id}/cancel`,
      {
        reason,
      },
    )
    return response.data
  },

  // 更新交易資訊 (只允許賣家在待交易狀態下更新)
  updateTrade: async (
    id: string,
    data: Partial<{
      price: number
      paymentMethods: AppearancePaymentMethod[]
    }>,
  ) => {
    const response = await api.patch<AppearanceTradeResponse>(`/api/appearance-trades/${id}`, data)
    return response.data
  },

  // 刪除交易 (只允許賣家刪除待交易的項目)
  deleteTrade: async (id: string) => {
    const response = await api.delete<AppearanceTradeResponse>(`/api/appearance-trades/${id}`)
    return response.data
  },
}

export default appearanceTradeApi
