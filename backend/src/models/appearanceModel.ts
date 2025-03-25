import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAppearance extends Document {
  officialName: string; // 外觀正式名稱
  nicknames: string[]; // 外觀暱稱列表
  imageUrl?: string; // 單一外觀照片URL
  category:
    | "外觀禮盒"
    | "上衣"
    | "髮型"
    | "披風"
    | "頭飾"
    | "背掛"
    | "腰掛"
    | "面掛"
    | "肩飾"
    | "眼飾"
    | "手飾"
    | "佩囊"
    | "小頭像"
    | "寵物"
    | "掛寵"
    | "坐騎"
    | "馬具"
    | "其他";
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
    imageUrl: String,
    category: {
      type: String,
      enum: [
        "外觀禮盒",
        "上衣",
        "髮型",
        "披風",
        "頭飾",
        "背掛",
        "腰掛",
        "面掛",
        "肩飾",
        "眼飾",
        "手飾",
        "佩囊",
        "小頭像",
        "寵物",
        "掛寵",
        "坐騎",
        "馬具",
        "其他",
      ],
      required: [true, "外觀分類是必須的"],
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
appearanceSchema.index({ nicknames: 1 });
appearanceSchema.index({ category: 1 }); // 新增類別索引

export default mongoose.model<IAppearance>("Appearance", appearanceSchema);
