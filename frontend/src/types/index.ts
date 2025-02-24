// src/types/index.ts

// 基礎型別定義
export type UserRole = 'admin' | 'user' | 'banned'
export type ProductStatus = 'active' | 'reserved' | 'sold' | 'deleted'
export type TransactionStatus = 'pending' | 'completed' | 'cancelled'
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
}

// 商品相關型別
export interface Product {
  _id: string // 與後端 MongoDB _id 一致
  id?: string // 前端可能需要的 id
  userId: string | User // 支持字串或用戶物件
  amount: number
  price: number
  ratio?: number
  status: ProductStatus
  createdAt?: string
  updatedAt?: string
  seller?: {
    name: string
    email: string
    contactInfo?: {
      line?: string
      discord?: string
      facebook?: string
    }
  }
}

// 交易相關型別
export interface Transaction {
  id: string
  transactionId?: string
  productId: string
  userId: string
  amount: number
  price: number
  status: TransactionStatus
  createdAt?: string
  updatedAt?: string
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
    user: Pick<User, 'id' | 'email' | 'name'>
  }
}
