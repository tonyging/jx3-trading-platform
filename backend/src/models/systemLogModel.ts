// models/systemLogModel.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISystemLog extends Document {
  type: "user" | "product" | "transaction" | "system";
  action: string;
  userId?: Types.ObjectId;
  details: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemLogSchema = new Schema<ISystemLog>(
  {
    type: {
      type: String,
      enum: ["user", "product", "transaction", "system"],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    details: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// 添加索引以提高查詢效率
systemLogSchema.index({ type: 1 });
systemLogSchema.index({ action: 1 });
systemLogSchema.index({ userId: 1 });
systemLogSchema.index({ createdAt: -1 });

const SystemLog = mongoose.model<ISystemLog>("SystemLog", systemLogSchema);
export default SystemLog;
