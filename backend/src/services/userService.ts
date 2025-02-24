import User, { IUser, IUserDocument } from "../models/userModel";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/emailService";
import { OAuth2Client } from "google-auth-library";

// 初始化 Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// 驗證碼暫存，實際環境建議使用 Redis
const verificationData = new Map<
  string,
  {
    code: string;
    expires: Date;
    password?: string;
  }
>();

// 使用 Map 暫存驗證碼（實際環境建議使用 Redis）
const resetCodes = new Map<string, { code: string; expires: Date }>();

interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
}

interface GoogleLoginData {
  token: string; // Google's ID token
}

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role?: "user" | "admin" | "banned";
  };
}

class UserService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new Error("找不到此電子郵件的使用者");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("密碼不正確");
    }

    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    };
  }

  // 發送驗證碼
  async sendVerificationCode(email: string, password: string): Promise<void> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("此電子郵件已經被註冊");
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    verificationData.set(email, {
      code: verificationCode,
      expires: new Date(Date.now() + 10 * 60 * 1000),
      password,
    });

    await sendVerificationEmail(email, verificationCode);
  }

  // 驗證碼確認，回傳是否成功
  async verifyCode(email: string, code: string): Promise<boolean> {
    const data = verificationData.get(email);

    if (!data) {
      throw new Error("請先獲取驗證碼");
    }

    if (new Date() > data.expires) {
      verificationData.delete(email);
      throw new Error("驗證碼已過期，請重新獲取");
    }

    if (data.code !== code) {
      throw new Error("驗證碼不正確");
    }

    return true;
  }

  async completeRegistration(
    email: string,
    name: string
  ): Promise<AuthResponse> {
    const data = verificationData.get(email);
    if (!data || !data.password) {
      throw new Error("註冊資訊已過期，請重新開始註冊流程");
    }

    const user: IUser = await User.create({
      email,
      password: data.password,
      name,
    });

    verificationData.delete(email);

    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    };
  }

  private generateToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("未設定 JWT 密鑰");
    }
    return jwt.sign({ id: userId }, jwtSecret, { expiresIn: "24h" });
  }

  async googleLogin(tokenId: string): Promise<AuthResponse> {
    try {
      // 驗證 Google token
      const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload() as GoogleProfile;

      if (!payload.email_verified) {
        throw new Error("Google 帳號尚未驗證");
      }

      // 檢查是否已有此 Google 帳號關聯的用戶
      let user = await User.findOne({ email: payload.email });

      if (!user) {
        // 如果是新用戶，創建帳號
        user = await User.create({
          email: payload.email,
          name: payload.name,
          googleId: payload.sub,
          // 生成隨機密碼供系統使用
          password: crypto.randomBytes(20).toString("hex"),
          isEmailVerified: true,
        });
      } else if (!user.googleId) {
        // 如果是現有用戶但未綁定 Google，進行綁定
        user.googleId = payload.sub;
        await user.save();
      }

      const token = this.generateToken(user._id.toString());

      return {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      console.error("Google 登入錯誤:", error);
      throw new Error("Google 登入驗證失敗");
    }
  }

  // 添加一個方法用於生成 Google 登入 URL
  getGoogleAuthUrl(): string {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    url.searchParams.append(
      "client_id",
      process.env.GOOGLE_CLIENT_ID as string
    );
    url.searchParams.append(
      "redirect_uri",
      process.env.GOOGLE_CALLBACK_URL as string
    );
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", "email profile");
    url.searchParams.append("access_type", "offline");
    url.searchParams.append("prompt", "consent");

    return url.toString();
  }

  // 處理 Google 回調
  async handleGoogleCallback(code: string): Promise<AuthResponse> {
    try {
      const response = await client.getToken({
        code,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      });

      const { tokens } = response;
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token as string,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload() as GoogleProfile;

      if (!payload.email_verified) {
        throw new Error("Google 帳號尚未驗證");
      }

      let user = await User.findOne({ email: payload.email });

      if (!user) {
        console.log("該用戶未註冊, 進行註冊");
        user = await User.create({
          email: payload.email,
          name: payload.name,
          googleId: payload.sub,
          password: crypto.randomBytes(20).toString("hex"),
          isEmailVerified: true,
        });
      } else {
        console.log("該用戶已經註冊");
      }

      const authToken = this.generateToken(user._id.toString());

      return {
        token: authToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || "user",
        },
      };
    } catch (error) {
      console.error("Google 回調處理錯誤:", error);
      throw new Error("Google 登入處理失敗");
    }
  }

  // 生成並儲存重設密碼驗證碼
  async generateAndSaveResetCode(email: string): Promise<string> {
    // 生成 6 位數驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 設置 10 分鐘有效期
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // 儲存驗證碼和過期時間
    resetCodes.set(email, { code, expires });

    return code;
  }

  // 驗證重設密碼驗證碼
  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const storedData = resetCodes.get(email);

    if (!storedData) {
      return false;
    }

    if (new Date() > storedData.expires) {
      resetCodes.delete(email);
      return false;
    }

    return storedData.code === code;
  }

  // 使用驗證碼重設密碼
  async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string
  ): Promise<boolean> {
    // 先驗證驗證碼
    const isCodeValid = await this.verifyResetCode(email, code);

    if (!isCodeValid) {
      return false;
    }

    // 更新使用者密碼
    const user = await User.findOne({ email });
    if (!user) {
      return false;
    }

    user.password = newPassword;
    await user.save();

    // 清除已使用的驗證碼
    resetCodes.delete(email);

    return true;
  }
}

export default new UserService();
