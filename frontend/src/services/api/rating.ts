// services/api/rating.ts
import api from './index'

// 評價請求類型
interface RatingRequest {
  toUserId: string
  score: number
  comment: string
  transactionId: string
}

// 評價響應類型
interface RatingResponse {
  status: string
  data: {
    rating: {
      _id: string
      fromUser: string
      toUser: string
      score: number
      comment: string
      createdAt: string
    }
  }
}

// 檢查評價存在響應類型
interface CheckRatingResponse {
  status: string
  exists: boolean
}

// 評價API服務
export const ratingApi = {
  // 創建評價
  createRating: async (data: RatingRequest) => {
    const response = await api.post<RatingResponse>('/api/ratings', data)
    return response.data
  },

  // 獲取用戶的評價列表
  getUserRatings: async (userId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/api/ratings/user/${userId}`, { params })
    return response.data
  },

  // 檢查是否已評價
  checkRatingExists: async (transactionId: string, fromUserId: string) => {
    const response = await api.get<CheckRatingResponse>(
      `/api/ratings/check?transactionId=${transactionId}&fromUserId=${fromUserId}`,
    )
    return response.data
  },

  // 刪除評價
  deleteRating: async (ratingId: string) => {
    const response = await api.delete(`/api/ratings/${ratingId}`)
    return response.data
  },
}

export default ratingApi
