// src/types/appearanceTrade.ts

// 外觀交易特定類型定義
export type AppearancePaymentMethod =
  | '匯款'
  | 'Line Pay'
  | '街口支付'
  | '支付寶'
  | '微信'
  | '8591'
  | '遊戲幣'

export type AppearanceCurrency = '台幣' | '人民幣' | '港幣' | '遊戲幣'

export type AppearanceTradeStatus =
  | 'pending' // 待交易
  | 'trading' // 交易中
  | 'pending_confirmation' // 待確認
  | 'completed' // 已完成
  | 'cancelled' // 已取消
  | 'deleted' // 已刪除

// 外觀交易訊息介面
export interface AppearanceTradeMessage {
  _id: string
  sender:
    | string
    | {
        _id: string
        name: string
        email: string
      }
  content: string
  timestamp: Date
}

// 付款證明介面
export interface AppearancePaymentProof {
  imageUrl: string
  uploadTime: Date
}

// 外觀交易介面
export interface AppearanceTrade {
  _id: string
  sellerId:
    | string
    | {
        _id: string
        name: string
        email: string
      }
  buyerId?:
    | string
    | {
        _id: string
        name: string
        email: string
      }
  appearanceId:
    | string
    | {
        _id: string
        officialName: string
        nicknames: string[]
        imageUrl?: string
        category: string
      }
  price: number
  status: AppearanceTradeStatus
  characterNickname: string
  paymentMethods: AppearancePaymentMethod[]
  selectedPaymentMethod?: AppearancePaymentMethod
  currency: AppearanceCurrency
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  cancelledAt?: Date
  messages?: AppearanceTradeMessage[]
  paymentProof?: AppearancePaymentProof
  sellerConfirmed: boolean
  buyerConfirmed: boolean
}

// API 響應型別
export interface AppearanceTradeResponse {
  status: string
  data: {
    trade: AppearanceTrade
  }
}

export interface AppearanceTradeListResponse {
  status: string
  data: {
    trades: AppearanceTrade[]
    pagination: {
      current: number
      total: number
      totalRecords: number
    }
  }
}

// 創建外觀交易請求型別
export interface CreateAppearanceTradeRequest {
  appearanceId: string
  price: number
  characterNickname: string
  paymentMethods: AppearancePaymentMethod[]
  currency: AppearanceCurrency
}

// 更新外觀交易請求型別
export interface UpdateAppearanceTradeRequest {
  price?: number
  paymentMethods?: AppearancePaymentMethod[]
}

// 預定外觀交易請求型別
export interface ReserveAppearanceTradeRequest {
  paymentMethod: AppearancePaymentMethod
}
