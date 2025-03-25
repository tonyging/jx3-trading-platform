// api/appearance.ts
import api from './index'
import type {
  AppearanceListResponse,
  AppearanceSubmissionListResponse,
  AppearanceSubmissionResponse,
  AppearanceImage,
} from '@/types'

export const appearanceApi = {
  // 提交新外觀
  submitAppearance: async (data: {
    officialName: string
    nicknames?: string[]
    images?: AppearanceImage
  }) => {
    const response = await api.post<AppearanceSubmissionResponse>('/api/appearances/submit', data)
    return response.data
  },

  // 獲取所有已審核外觀
  getAllAppearances: async (params?: { page?: number; limit?: number; query?: string }) => {
    const response = await api.get<AppearanceListResponse>('/api/appearances/public', { params })
    return response.data
  },

  // 獲取待審核的外觀提交
  getPendingSubmissions: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<AppearanceSubmissionListResponse>('/api/appearances/pending', {
      params,
    })
    return response.data
  },

  // 審核外觀提交
  reviewSubmission: async (submissionId: string, action: 'approve' | 'reject', reason?: string) => {
    const response = await api.post<AppearanceSubmissionResponse>(
      `/api/appearances/review/${submissionId}`,
      {
        action,
        reason,
      },
    )
    return response.data
  },

  // 獲取我的提交
  getUserSubmissions: async (params?: {
    page?: number
    limit?: number
    status?: 'pending' | 'approved' | 'rejected'
  }) => {
    const response = await api.get<AppearanceSubmissionListResponse>(
      '/api/appearances/my-submissions',
      { params },
    )
    return response.data
  },

  // 獲取外觀統計
  getAppearanceStats: async () => {
    const response = await api.get<{
      status: string
      data: {
        totalAppearances: number
        pendingSubmissions: number
      }
    }>('/api/appearances/stats')
    return response.data
  },

  // 刪除提交的外觀
  deleteSubmission: async (submissionId: string) => {
    const response = await api.delete<{
      status: string
      message: string
    }>(`/api/appearances/submission/${submissionId}`)
    return response.data
  },
}
