import api from './index'

// 用戶聯繫資訊介面
export interface UserContactInfo {
  line?: string
  discord?: string
  facebook?: string
}

// 用戶介面
export interface TransactionUser {
  _id: string
  name: string
  email: string
  contactInfo?: UserContactInfo
}

// 訊息介面
export interface TransactionMessage {
  _id: string
  sender: string
  content: string
  timestamp: Date
}

// 匯款證明介面
export interface PaymentProof {
  imageUrl: string
  uploadTime: Date
}

// 交易介面
export interface Transaction {
  _id: string
  seller: TransactionUser
  buyer: TransactionUser
  product: string
  amount: number
  price: number
  status: 'reserved' | 'pending_payment' | 'payment_confirmed' | 'completed' | 'cancelled'
  sellerBankAccount?: string
  paymentProof?: PaymentProof
  messages: TransactionMessage[]
  createdAt: Date
  updatedAt: Date
  sellerConfirmed: boolean
  buyerConfirmed: boolean
}

// API 響應介面
export interface TransactionResponse {
  status: string
  data: Transaction
}

export interface TransactionsResponse {
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

export interface CompleteTransactionResponse {
  status: string
  message: string
  data: Transaction
}

// 交易相關 API
export const transactionApi = {
  // 獲取交易詳情
  getTransactionDetails: async (transactionId: string) => {
    const response = await api.get<TransactionResponse>(`/api/transactions/${transactionId}`)
    return response.data
  },

  // 發送訊息
  sendMessage: async (transactionId: string, message: string) => {
    const response = await api.post<TransactionResponse>(
      `/api/transactions/${transactionId}/messages`,
      { content: message },
    )
    return response.data
  },

  // 上傳匯款證明
  uploadPaymentProof: async (transactionId: string, file: File) => {
    const formData = new FormData()
    formData.append('paymentProof', file)

    const response = await api.post<TransactionResponse>(
      `/api/transactions/${transactionId}/payment-proof`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return response.data
  },

  // 獲取用戶的交易列表
  getUserTransactions: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get<TransactionsResponse>('/api/transactions', { params })
    return response.data
  },

  completeTransaction: async (transactionId: string) => {
    const response = await api.post<CompleteTransactionResponse>(
      `/api/transactions/${transactionId}/complete`,
    )
    return response.data
  },
}
