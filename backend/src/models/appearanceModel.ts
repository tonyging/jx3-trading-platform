import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAppearanceImage {
  adultMale?: string; // 成人男性照片URL
  adultFemale?: string; // 成人女性照片URL
  childMale?: string; // 孩童男性照片URL
  childFemale?: string; // 孩童女性照片URL
}

export interface IAppearance extends Document {
  officialName: string; // 外觀正式名稱
  nicknames: string[]; // 外觀暱稱列表
  images: IAppearanceImage; // 外觀照片
  submittedBy: Types.ObjectId; // 最初提交用戶
  approvedBy: Types.ObjectId[]; // 批准用戶列表
  createdAt: Date;
  updatedAt: Date;
}

const appearanceSchema = new Schema<IAppearance>(
  {
    officialName: {
      type: String,
      required: [true, "外觀正式名稱是必須的"],
      unique: true,
      trim: true,
    },
    nicknames: {
      type: [String],
      default: [],
    },
    images: {
      adultMale: String,
      adultFemale: String,
      childMale: String,
      childFemale: String,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 添加索引
appearanceSchema.index({ officialName: 1 });
appearanceSchema.index({ nicknames: 1 });

export default mongoose.model<IAppearance>("Appearance", appearanceSchema);
