// models/appearanceSubmissionModel.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAppearanceSubmission extends Document {
  officialName: string; // 外觀正式名稱
  nicknames?: string[]; // 外觀暱稱列表
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
  submittedBy: Types.ObjectId; // 提交用戶ID
  createdAt: Date;
  updatedAt: Date;
  status: "pending" | "approved" | "rejected"; // 審核狀態
  approvals: {
    // 審核紀錄
    userId: Types.ObjectId; // 審核用戶
    timestamp: Date;
    comment?: string;
  }[];
  rejections: {
    // 拒絕紀錄
    userId: Types.ObjectId;
    timestamp: Date;
    reason: string;
  }[];
}

const appearanceSubmissionSchema = new Schema<IAppearanceSubmission>(
  {
    officialName: {
      type: String,
      required: [true, "外觀正式名稱是必須的"],
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
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvals: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        comment: String,
      },
    ],
    rejections: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        reason: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 添加索引提升查詢效率
appearanceSubmissionSchema.index({ officialName: 1 });
appearanceSubmissionSchema.index({ status: 1 });
appearanceSubmissionSchema.index({ "approvals.userId": 1 });

export default mongoose.model<IAppearanceSubmission>(
  "AppearanceSubmission",
  appearanceSubmissionSchema
);
