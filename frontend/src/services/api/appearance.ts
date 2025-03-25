// api/appearance.ts
import api from './index'
import type {
  AppearanceListResponse,
  AppearanceSubmissionListResponse,
  AppearanceSubmissionResponse,
  AppearanceCategory,
  Appearance,
} from '@/types'

export const appearanceApi = {
  // 提交新外觀
  submitAppearance: async (data: {
    officialName: string
    nicknames?: string[]
    imageUrl?: string
    category: AppearanceCategory
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

  // 上傳外觀圖片 (管理員專用)
  uploadAppearanceImage: async (appearanceId: string, imageFile: File) => {
    console.log('Uploading file:', imageFile)

    const formData = new FormData()
    formData.append('image', imageFile)

    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1])
    }

    const response = await api.post<{
      status: string
      data: {
        appearance: Appearance
        imageUrl: string
      }
    }>(`/api/appearances/${appearanceId}/upload-image`, formData)
    return response.data
  },
}
