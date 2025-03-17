import User, { IUser, IUserDocument } from "../models/userModel";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/emailService";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

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

  // 獲取 Discord 授權 URL
  getDiscordAuthUrl(userId: string): string {
    const url = new URL("https://discord.com/oauth2/authorize");

    // 原有的基本參數設置
    url.searchParams.append(
      "client_id",
      process.env.DISCORD_CLIENT_ID as string
    );
    url.searchParams.append("response_type", "code");
    url.searchParams.append(
      "redirect_uri",
      process.env.DISCORD_REDIRECT_URI as string
    );
    url.searchParams.append("scope", process.env.DISCORD_SCOPE as string);

    // 新增 state 參數攜帶用戶 ID
    url.searchParams.append("state", userId);

    return url.toString();
  }

  // 處理 Discord 回調
  async handleDiscordCallback(code: string, userId: string): Promise<any> {
    try {
      // 步驟 1: 交換 code 獲取訪問令牌
      const tokenResponse = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID as string,
          client_secret: process.env.DISCORD_CLIENT_SECRET as string,
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.DISCORD_REDIRECT_URI as string,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token } = tokenResponse.data;

      // 步驟 2: 使用令牌獲取用戶信息
      const userResponse = await axios.get(
        "https://discord.com/api/users/@me",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const discordUser = userResponse.data;

      // 從 Discord ID 提取創建時間戳
      // Discord ID 是基於 snowflake 算法的，前 42 位是時間戳
      const discordId = discordUser.id;
      const discordCreationTimestamp =
        this.getDiscordAccountCreationDate(discordId);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (discordCreationTimestamp > oneYearAgo) {
        throw new Error("DISCORD_ACCOUNT_TOO_NEW");
      }

      // 檢查該 Discord ID 是否已被其他用戶使用
      const existingUser = await User.findOne({
        discordId: discordUser.id,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new Error("此 Discord 帳號已被其他用戶綁定");
      }

      // 更新用戶的 Discord 資料
      let discordUsername;
      if (discordUser.discriminator && discordUser.discriminator !== "0") {
        // 舊系統，有判別號
        discordUsername = `${discordUser.username}#${discordUser.discriminator}`;
      } else {
        // 新系統，沒有判別號
        discordUsername = discordUser.username;
      }

      // 構建頭像 URL (如果用戶有頭像)
      const discordAvatar = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null;

      // 獲取全局顯示名稱 (可能是中文名)
      const global_name = discordUser.global_name || null;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          "contactInfo.discord": discordUsername,
          discordId: discordUser.id,
          discordUsername: discordUsername, // 同時在專屬欄位保存用戶名
          discordAvatar: discordAvatar,
          global_name: global_name,
        },
        { new: true }
      );

      if (!user) {
        throw new Error("更新用戶 Discord 資訊失敗");
      }

      return {
        status: "success",
        discordUsername,
      };
    } catch (error) {
      console.error("Discord 登入失敗:", error);
      throw error;
    }
  }

  private getDiscordAccountCreationDate(discordId: string): Date {
    // Discord ID 是一個 snowflake ID，包含創建時間信息
    // 將 ID 轉換為二進制，然後提取時間戳部分
    const binaryId = BigInt(discordId).toString(2).padStart(64, "0");
    const timestamp = parseInt(binaryId.substring(0, 42), 2);

    // Discord epoch 是 2015-01-01T00:00:00.000Z
    const discordEpoch = 1420070400000;
    const creationTimestamp = timestamp + discordEpoch;

    return new Date(creationTimestamp);
  }
}

export default new UserService();
