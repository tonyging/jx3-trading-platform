import mongoose, { Schema, Document, Types } from "mongoose";
import { ITransaction } from "./transactionModel";

interface IPartialReservedTransaction {
  transactionId: Types.ObjectId;
  buyerId: Types.ObjectId;
  reservedAmount: number;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  userId:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        name: string;
        email: string;
      };
  buyerId?:
    | Types.ObjectId
    | {
        // 添加買家 ID
        _id: Types.ObjectId;
        name: string;
        email: string;
      };
  amount: number; // 遊戲幣數量
  price: number; // 售價
  ratio: number; // 比值（自動計算：遊戲幣數量/售價）
  status: "active" | "reserved" | "sold" | "deleted";
  transactionId?: Types.ObjectId | ITransaction;
  createdAt: Date;
  updatedAt: Date;
  partialReservedTransactions: IPartialReservedTransaction[];
}

const partialReservedTransactionSchema =
  new Schema<IPartialReservedTransaction>({
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reservedAmount: {
      type: Number,
      required: true,
      min: [0, "保留數量不能為負數"],
    },
  });

const productSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "賣家ID是必須的"],
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // 一開始不需要買家
    },
    amount: {
      type: Number,
      required: [true, "遊戲幣數量是必須的"],
      min: [0, "遊戲幣數量不能為負數"],
    },
    price: {
      type: Number,
      required: [true, "售價是必須的"],
      min: [0, "售價不能為負數"],
    },
    ratio: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "reserved", "sold", "deleted"],
      default: "active",
    },
    partialReservedTransactions: [
      {
        transactionId: {
          type: Schema.Types.ObjectId,
          ref: "Transaction",
          required: true,
        },
        buyerId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reservedAmount: {
          type: Number,
          required: true,
          min: [0, "保留數量不能為負數"],
        },
      },
    ],
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// 在 pre-save 中間件中計算比值
productSchema.pre("save", function (next) {
  if (this.isModified("price") || this.isModified("amount")) {
    this.ratio = this.amount > 0 ? this.amount / this.price : 0;
  }
  next();
});

// 添加索引
productSchema.index({ status: 1 });
productSchema.index({ ratio: -1 });
productSchema.index({ price: 1 });
productSchema.index({ amount: 1 });

export default mongoose.model<IProduct>("Product", productSchema);
