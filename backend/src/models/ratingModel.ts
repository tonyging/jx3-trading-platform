import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRating extends Document {
  fromUser: Types.ObjectId; // 評價者
  toUser: Types.ObjectId; // 被評價者
  score: number; // 評分 (1-5)
  comment: string; // 評價內容
  createdAt: Date; // 評價時間
  isDeleted: boolean; // 軟刪除標記
}

const ratingSchema = new Schema(
  {
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "評價者ID是必須的"],
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "被評價者ID是必須的"],
    },
    score: {
      type: Number,
      required: [true, "評分是必須的"],
      min: [1, "評分最低為 1"],
      max: [5, "評分最高為 5"],
    },
    comment: {
      type: String,
      required: [true, "評價內容是必須的"],
      trim: true,
      maxlength: [500, "評價內容不能超過 500 字"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRating>("Rating", ratingSchema);
