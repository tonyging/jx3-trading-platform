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
