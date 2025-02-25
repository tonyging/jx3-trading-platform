// src/types/index.ts

// 基礎型別定義
export type UserRole = 'admin' | 'user' | 'banned'
export type ProductStatus = 'active' | 'reserved' | 'sold' | 'deleted'
export type TransactionStatus =
  | 'reserved'
  | 'pending_payment'
  | 'payment_confirmed'
  | 'completed'
  | 'cancelled'
export type ProductListType = 'all' | 'my' | 'trading' | 'admin'

// 用戶相關型別
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt?: Date
  username?: string
  avatar?: string
  contactInfo?: {
    line?: string
    discord?: string
    facebook?: string
  }
}

// 部分保留交易相關型別
export interface PartialReservedTransaction {
  transactionId: string
  buyerId: string
  reservedAmount: number
}

// 商品相關型別
export interface Product {
  id: string
  userId:
    | string
    | {
        id: string
        name: string
        email: string
      }
  buyerId?:
    | string
    | {
        id: string
        name: string
        email: string
      }
  amount: number
  price: number
  ratio: number
  status: ProductStatus
  transactionId?: string | Transaction
  createdAt: string
  updatedAt: string
  partialReservedTransactions: PartialReservedTransaction[]
  originalProductId?: string // 添加此欄位
}

// 交易訊息
export interface TransactionMessage {
  sender: string
  content: string
  timestamp: Date
}

// 支付證明
export interface PaymentProof {
  imageUrl: string
  uploadTime: Date
}

// 交易相關型別
export interface Transaction {
  id: string
  seller: string | User
  buyer: string | User
  product: string | Product
  originalProductId?: string // 如果是部分交易
  amount: number
  price: number
  status: TransactionStatus
  paymentProof?: PaymentProof
  messages: TransactionMessage[]
  sellerBankAccount?: string
  createdAt: Date
  updatedAt: Date
  sellerConfirmed: boolean
  buyerConfirmed: boolean
}

// 響應型別
export interface UserResponse {
  status: string
  data: User
}

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

export interface TransactionResponse {
  status: string
  data: {
    transaction: Transaction
  }
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

// 認證相關型別
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  username?: string
}

export interface LoginResponse {
  status: string
  data: {
    token: string
    user: User
  }
}

// API 錯誤響應
export interface ErrorResponse {
  status: string
  message: string
  errors?: Record<string, string[]>
}

// 完成交易響應
export interface CompleteTransactionResponse {
  status: string
  message: string
  data: Transaction
}
