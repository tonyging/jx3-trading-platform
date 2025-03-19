import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  seller: Types.ObjectId;
  buyer: Types.ObjectId;
  product: Types.ObjectId;
  originalProductId?: Types.ObjectId; // 如果是部分交易
  amount: number;
  price: number;
  status:
    | "reserved"
    | "pending_payment"
    | "payment_confirmed"
    | "completed"
    | "cancelled";
  paymentProof?: {
    imageUrl: string;
    uploadTime: Date;
  };
  messages: [
    {
      sender: Types.ObjectId;
      content: string;
      timestamp: Date;
    }
  ];
  sellerBankAccount?: string;
  createdAt: Date;
  updatedAt: Date;
  sellerConfirmed: boolean;
  buyerConfirmed: boolean;
  paymentMethod: string; // 實際使用的交易方式
  characterNickname: string; // 角色暱稱
  currency: string; // 幣別
}

const transactionSchema = new Schema<ITransaction>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    originalProductId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "交易數量必須大於0"],
    },
    price: {
      type: Number,
      required: true,
      min: [0, "交易價格不能為負數"],
    },
    status: {
      type: String,
      enum: [
        "reserved",
        "pending_payment",
        "payment_confirmed",
        "completed",
        "cancelled",
      ],
      default: "reserved",
    },
    paymentProof: {
      imageUrl: {
        type: String,
      },
      uploadTime: {
        type: Date,
      },
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
          maxlength: [500, "留言內容不能超過500字"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sellerBankAccount: {
      type: String,
      trim: true,
    },
    sellerConfirmed: {
      type: Boolean,
      default: false,
    },
    buyerConfirmed: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["匯款", "Line Pay", "街口支付", "支付寶", "微信"],
      required: [true, "必須選擇一種交易方式"],
    },
    characterNickname: {
      type: String,
      required: [true, "角色暱稱是必須的"],
    },
    currency: {
      type: String,
      enum: ["台幣", "人民幣", "港幣"],
      required: [true, "幣別是必須的"],
    },
  },
  {
    timestamps: true, // 自動添加 createdAt 和 updatedAt 欄位
  }
);

// 添加索引提高查詢效率
transactionSchema.index({ seller: 1 });
transactionSchema.index({ buyer: 1 });
transactionSchema.index({ product: 1 });
transactionSchema.index({ status: 1 });

export default mongoose.model<ITransaction>("Transaction", transactionSchema);
