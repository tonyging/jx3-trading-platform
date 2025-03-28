// models/appearanceTradeModel.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type AppearanceTradeStatus =
  | "pending" // 待交易
  | "trading" // 交易中
  | "pending_confirmation" // 待確認
  | "completed" // 已完成
  | "cancelled" // 已取消
  | "deleted"; // 已刪除

export type PaymentMethod =
  | "匯款"
  | "Line Pay"
  | "街口支付"
  | "支付寶"
  | "微信"
  | "8591"
  | "遊戲幣";

export type Currency = "台幣" | "人民幣" | "港幣" | "遊戲幣";

export interface IAppearanceTrade extends Document {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId; // 賣家ID
  buyerId?: Types.ObjectId; // 買家ID (交易完成後才有)
  appearanceId: Types.ObjectId; // 關聯到外觀資料庫
  price: number; // 售價
  status: AppearanceTradeStatus;
  characterNickname: string; // 角色暱稱
  paymentMethods: PaymentMethod[]; // 賣家支援的交易方式
  selectedPaymentMethod?: PaymentMethod; // 買家選擇的交易方式
  currency: Currency; // 幣別
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date; // 交易完成時間
  cancelledAt?: Date; // 交易取消時間
  adminDeletedAt?: Date; // 管理員刪除時間
  adminDeletedBy?: Types.ObjectId; // 操作的管理員
  messages?: Array<{
    // 交易訊息
    sender: Types.ObjectId;
    content: string;
    timestamp: Date;
  }>;
  paymentProof?: {
    // 付款證明
    imageUrl: string;
    uploadTime: Date;
  };
  sellerConfirmed: boolean; // 賣家確認狀態
  buyerConfirmed: boolean; // 買家確認狀態
}

const appearanceTradeSchema = new Schema<IAppearanceTrade>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "賣家ID是必須的"],
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    appearanceId: {
      type: Schema.Types.ObjectId,
      ref: "Appearance",
      required: [true, "外觀ID是必須的"],
    },
    price: {
      type: Number,
      required: [true, "售價是必須的"],
      min: [0, "售價不能為負數"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "trading",
        "pending_confirmation",
        "completed",
        "cancelled",
        "deleted",
      ],
      default: "pending",
    },
    characterNickname: {
      type: String,
      required: [true, "角色暱稱是必須的"],
      trim: true,
      maxlength: [10, "角色暱稱不能超過10個字"],
    },
    paymentMethods: {
      type: [String],
      enum: [
        "匯款",
        "Line Pay",
        "街口支付",
        "支付寶",
        "微信",
        "8591",
        "遊戲幣",
      ],
      required: [true, "至少需要提供一種交易方式"],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: "至少需要提供一種交易方式",
      },
    },
    selectedPaymentMethod: {
      type: String,
      enum: [
        "匯款",
        "Line Pay",
        "街口支付",
        "支付寶",
        "微信",
        "8591",
        "遊戲幣",
      ],
      required: false,
    },
    currency: {
      type: String,
      enum: ["台幣", "人民幣", "港幣", "遊戲幣"],
      default: "台幣",
      required: [true, "幣別是必須的"],
    },
    completedAt: {
      type: Date,
      required: false,
    },
    cancelledAt: {
      type: Date,
      required: false,
    },
    adminDeletedAt: {
      type: Date,
      required: false,
    },
    adminDeletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    messages: [
      {
        sender: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "訊息內容不能超過500字"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    paymentProof: {
      imageUrl: {
        type: String,
      },
      uploadTime: {
        type: Date,
      },
    },
    sellerConfirmed: {
      type: Boolean,
      default: false,
    },
    buyerConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 添加索引提高查詢效率
appearanceTradeSchema.index({ sellerId: 1 });
appearanceTradeSchema.index({ buyerId: 1 });
appearanceTradeSchema.index({ appearanceId: 1 });
appearanceTradeSchema.index({ status: 1 });
appearanceTradeSchema.index({ price: 1 });

export default mongoose.model<IAppearanceTrade>(
  "AppearanceTrade",
  appearanceTradeSchema
);
