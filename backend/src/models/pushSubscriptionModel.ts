// models/pushSubscriptionModel.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPushSubscription extends Document {
  userId: Types.ObjectId;
  subscription: string; // 存儲為JSON字符串
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscription: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 為使用者ID創建唯一索引，確保每個使用者只有一個訂閱
pushSubscriptionSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model<IPushSubscription>(
  "PushSubscription",
  pushSubscriptionSchema
);
