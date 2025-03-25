import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAppearanceImage {
  adultMale?: string; // 成人男性照片URL
  adultFemale?: string; // 成人女性照片URL
  childMale?: string; // 孩童男性照片URL
  childFemale?: string; // 孩童女性照片URL
}

export interface IAppearanceSubmission extends Document {
  officialName: string; // 外觀正式名稱
  nicknames?: string[]; // 外觀暱稱列表
  images?: IAppearanceImage; // 外觀照片
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
