import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

// 定義使用者文件的基本結構
export interface IUserDocument {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  loginAttempts: number; // 失敗的登入次數
  lockUntil: Date | null; // 帳號鎖定到期時間
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string; // 使用 ? 表示這是可選欄位
  resetPasswordExpires?: Date;
  averageRating: number; // 平均評分
  totalRatings: number; // 評價總數
  contactInfo: {
    line?: string;
    discord?: string;
    facebook?: string;
  };
  role: "user" | "admin" | "banned"; // 新增角色欄位
  banReason?: string; // 新增停權原因欄位
  bannedAt?: Date; // 新增停權時間欄位
  bannedUntil?: Date; // 新增停權結束時間欄位
  isEmailVerified: boolean; // 電子郵件是否已驗證
  emailVerificationToken?: string; // 電子郵件驗證 token
  emailVerificationExpires?: Date; // 驗證 token 過期時間
  googleId?: string; // Google 的唯一識別碼
  phoneNumber?: string;
  isPhoneVerified: boolean;
  phoneVerificationId?: string;
}

// 定義包含 MongoDB 文件特性的完整使用者介面
export interface IUser extends IUserDocument {
  comparePassword(candidatePassword: string): Promise<boolean>;
  isBanned(): boolean;
  isVerified(): boolean;
}

// 定義模型的靜態方法介面
export interface IUserModel extends mongoose.Model<IUser> {}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "請提供電子郵件"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "請提供密碼"],
      minlength: [8, "密碼長度至少需要 8 個字元"],
    },
    name: {
      type: String,
      required: [true, "請提供姓名"],
      trim: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    contactInfo: {
      line: {
        type: String,
        trim: true,
      },
      discord: {
        type: String,
        trim: true,
      },
      facebook: {
        type: String,
        trim: true,
      },
    },
    role: {
      type: String,
      enum: ["user", "admin", "banned"],
      default: "user",
      required: true,
    },
    banReason: {
      type: String,
      required: false,
    },
    bannedAt: {
      type: Date,
      required: false,
    },
    bannedUntil: {
      type: Date,
      required: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false, // 與密碼重設 token 一樣，不會在一般查詢中返回
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true, // 允許為空但當有值時必須唯一
      unique: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // 允許為空但有值時必須唯一
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerificationId: String,
  },
  {
    timestamps: true,
  }
);

// 檢查用戶是否被停權
userSchema.methods.isBanned = function (): boolean {
  return (
    this.role === "banned" &&
    (!this.bannedUntil || this.bannedUntil > new Date())
  );
};

userSchema.methods.isVerified = function (): boolean {
  return this.isEmailVerified;
};

// 在儲存文件前的中間件，用於加密密碼
userSchema.pre("save", async function (next) {
  // 如果密碼沒有被修改，跳過加密步驟
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    } catch (error) {
      return next(error as Error);
    }
  }

  // 檢查驗證 token 是否過期
  if (
    this.emailVerificationExpires &&
    this.emailVerificationExpires < new Date() &&
    !this.isEmailVerified
  ) {
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
  }

  // 檢查是否需要解除停權
  if (
    this.role === "banned" &&
    this.bannedUntil &&
    this.bannedUntil < new Date()
  ) {
    this.role = "user";
    this.banReason = undefined;
    this.bannedAt = undefined;
    this.bannedUntil = undefined;
  }
});

// 添加密碼比對方法到 schema
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // 使用 bcrypt 比對提供的密碼和資料庫中儲存的加密密碼
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("密碼比對過程發生錯誤");
  }
};

const User = mongoose.model<IUser, IUserModel>("User", userSchema);
export default User;
