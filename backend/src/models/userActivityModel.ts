// models/userActivityModel.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserActivity extends Document {
  userId: Types.ObjectId;
  actionType: string;
  targetType: "product" | "transaction" | "message";
  targetId: Types.ObjectId;
  metadata: {
    previousStatus?: string;
    newStatus?: string;
    productAmount?: number;
    productPrice?: number;
    messageContent?: string;
    [key: string]: any;
  };
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const userActivitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  actionType: {
    type: String,
    required: true,
    index: true,
    enum: [
      "VIEW_PRODUCT",
      "CREATE_PRODUCT",
      "UPDATE_PRODUCT",
      "DELETE_PRODUCT",
      "CREATE_TRANSACTION",
      "UPDATE_TRANSACTION_STATUS",
      "SEND_MESSAGE",
      "UPLOAD_PAYMENT_PROOF",
    ],
  },
  targetType: {
    type: String,
    required: true,
    enum: ["product", "transaction", "message"],
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "targetType",
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// 創建複合索引來提升查詢效能
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ targetType: 1, targetId: 1 });
userActivitySchema.index({ actionType: 1, createdAt: -1 });

export default mongoose.model<IUserActivity>(
  "UserActivity",
  userActivitySchema
);
