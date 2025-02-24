import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILoginHistory extends Document {
  userId: Types.ObjectId;
  loginTime: Date;
  ipAddress: string;
  userAgent: string; // 瀏覽器和設備資訊
  status: "success" | "failed";
  failureReason?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

const loginHistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  loginTime: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    required: true,
  },
  failureReason: {
    type: String,
  },
  location: {
    country: String,
    region: String,
    city: String,
  },
});

export default mongoose.model<ILoginHistory>(
  "LoginHistory",
  loginHistorySchema
);
