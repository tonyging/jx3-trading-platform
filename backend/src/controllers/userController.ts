import { Request, Response, NextFunction } from "express";
import userService from "../services/userService";
import User, { IUser } from "../models/userModel";
import crypto from "crypto";
import { sendResetPasswordEmail } from "../services/emailService";
import LoginHistory from "../models/loginHistoryModel";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import geoip from "geoip-lite";
import { auth } from "../config/firebase";

class UserController {
  // 發送驗證碼
  public async sendVerificationCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password } = req.body;

      // 驗證必要欄位
      if (!email || !password) {
        return res.status(400).json({
          status: "error",
          message: "請提供電子郵件地址和密碼",
        });
      }

      // 密碼長度驗證
      if (password.length < 8) {
        return res.status(400).json({
          status: "error",
          message: "密碼長度至少需要 8 個字元",
        });
      }

      await userService.sendVerificationCode(email, password);

      res.status(200).json({
        status: "success",
        message: "驗證碼已發送至您的電子郵件",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "此電子郵件已經被註冊") {
          return res.status(400).json({
            status: "error",
            message: error.message,
          });
        }
      }
      res.status(500).json({
        status: "error",
        message: "發送驗證碼時發生錯誤",
      });
    }
  }

  // 驗證碼確認
  public async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          status: "error",
          message: "請提供電子郵件和驗證碼",
        });
      }

      await userService.verifyCode(email, code);

      res.status(200).json({
        status: "success",
        message: "驗證碼正確",
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          status: "error",
          message: error.message,
        });
      }
      res.status(500).json({
        status: "error",
        message: "驗證過程發生錯誤",
      });
    }
  }

  // 完成註冊
  public async completeRegistration(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, name } = req.body;

      if (!email || !name) {
        return res.status(400).json({
          status: "error",
          message: "請提供所有必要資訊",
        });
      }

      const authResponse = await userService.completeRegistration(email, name);

      res.status(201).json({
        status: "success",
        message: "註冊成功",
        data: authResponse,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          status: "error",
          message: error.message,
        });
      }
      res.status(500).json({
        status: "error",
        message: "註冊過程發生錯誤",
      });
    }
  }

  public login = async (req: Request, res: Response, next: NextFunction) => {
    console.log("登入請求數據:", {
      email: req.body.email,
      hasPassword: !!req.body.password,
      time: new Date().toISOString(),
    });
    try {
      // 查找用戶
      const founduser = await User.findOne({ email: req.body.email });
      console.log("資料庫查詢結果:", {
        userFound: !!founduser,
        email: req.body.email,
        time: new Date().toISOString(),
      });
      if (!founduser) {
        console.log("登入失敗: 用戶不存在");
        return res.status(401).json({ message: "帳號或密碼錯誤" });
      }

      // 驗證密碼
      const isValidPassword = await founduser.comparePassword(
        req.body.password
      );
      console.log("密碼驗證結果:", {
        isValid: isValidPassword,
        time: new Date().toISOString(),
      });

      if (!isValidPassword) {
        console.log("登入失敗: 密碼錯誤");
        return res.status(401).json({ message: "帳號或密碼錯誤" });
      }

      // 如果登入成功
      console.log("登入成功:", {
        userId: founduser._id,
        email: founduser.email,
        time: new Date().toISOString(),
      });

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");

      const location = this.getLocationInfo(req.ip || "");

      if (!user) {
        // 建立一個預設的 ObjectId
        const defaultUserId = new Types.ObjectId();

        await LoginHistory.create({
          userId: defaultUserId, // 直接使用新建立的 ObjectId
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "unknown",
          status: "failed",
          location,
          failureReason: "找不到使用者",
        });

        return res.status(401).json({
          status: "error",
          message: "電子郵件或密碼不正確",
        });
      }

      // 找到使用者後的 loginAttempt
      const loginAttempt = {
        userId: user._id, // 直接使用 user._id
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || "unknown",
        status: "failed" as const,
        location,
      };

      // 檢查帳號是否被鎖定
      if (user.lockUntil && user.lockUntil > new Date()) {
        await LoginHistory.create({
          ...loginAttempt,
          failureReason: "帳號已被鎖定",
        });

        const remainingTime = Math.ceil(
          (user.lockUntil.getTime() - Date.now()) / 1000 / 60
        );
        return res.status(401).json({
          status: "error",
          message: `帳號已被暫時鎖定，請在 ${remainingTime} 分鐘後再試`,
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // 增加失敗次數
        user.loginAttempts += 1;

        // 如果失敗次數達到 5 次，鎖定帳號 30 分鐘
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 分鐘
          user.loginAttempts = 0; // 重置嘗試次數
        }
        await user.save();

        await LoginHistory.create({
          ...loginAttempt,
          failureReason: "密碼不正確",
        });

        // 如果帳號被鎖定，返回特定訊息
        if (user.lockUntil) {
          return res.status(401).json({
            status: "error",
            message: "登入失敗次數過多，帳號已被暫時鎖定 30 分鐘",
          });
        }

        return res.status(401).json({
          status: "error",
          message: `電子郵件或密碼不正確，還剩 ${
            5 - user.loginAttempts
          } 次嘗試機會`,
        });
      }

      // 登入成功，重置登入嘗試次數和鎖定時間
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      if (user.role === "banned") {
        const remainingBanTime = user.bannedUntil
          ? Math.ceil((user.bannedUntil.getTime() - Date.now()) / 1000 / 60)
          : null;

        await LoginHistory.create({
          ...loginAttempt,
          status: "failed",
          failureReason: "帳號已被封禁",
        });

        return res.status(403).json({
          status: "error",
          message: remainingBanTime
            ? `帳號已被封禁，預計還剩 ${remainingBanTime} 分鐘`
            : "帳號已被永久封禁",
        });
      }

      // 記錄成功的登入
      await LoginHistory.create({
        ...loginAttempt,
        status: "success",
      });

      const token = this.generateToken(user);

      res.status(200).json({
        status: "success",
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role || "user",
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // 因為已經通過驗證中間件，所以 req.user 一定存在
      const user = req.user;

      // 回傳使用者資訊，但排除敏感資料
      res.status(200).json({
        status: "success",
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          role: user.role || "user",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // 首先確保使用者不能更新某些敏感欄位
      const allowedUpdates = ["name"]; // 目前只允許更新名稱
      const updates = Object.keys(req.body);

      // 找出所有不被允許的欄位
      const invalidUpdates = updates.filter(
        (update) => !allowedUpdates.includes(update)
      );

      if (invalidUpdates.length > 0) {
        // 回傳結構化的錯誤訊息，包含具體的錯誤資訊
        return res.status(400).json({
          status: "error",
          message: "包含不允許更新的欄位",
          details: {
            allowedFields: allowedUpdates,
            invalidFields: invalidUpdates,
          },
        });
      }

      // 因為通過了驗證中間件，所以 req.user 一定存在
      const user = req.user;

      // 更新允許的欄位
      updates.forEach((update) => {
        user[update] = req.body[update];
      });

      // 儲存更新後的使用者資料
      await user.save();

      res.status(200).json({
        status: "success",
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // 首先驗證使用者提供的當前密碼是否正確
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: "error",
          message: "目前的密碼不正確",
        });
      }

      // 驗證新密碼的格式
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          status: "error",
          message: "新密碼必須至少包含 8 個字元",
        });
      }

      // 更新密碼
      user.password = newPassword;
      await user.save(); // 這裡會觸發我們之前設定的密碼加密中間件

      res.status(200).json({
        status: "success",
        message: "密碼更新成功",
        data: {
          id: user._id,
          email: user.email,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message:
          error instanceof Error ? error.message : "更新密碼過程發生錯誤",
      });
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // 取得加密後的令牌
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // 尋找擁有有效重設令牌的使用者
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          status: "error",
          message: "重設令牌無效或已過期",
        });
      }

      // 更新密碼
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({
        status: "success",
        message: "密碼重設成功",
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "重設密碼時發生錯誤",
      });
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      // 查找使用者並立即將結果存到 user 變數中
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "找不到使用此電子郵件的使用者",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");

      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordExpires = new Date(Date.now() + 3600000);

      await user.save();

      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/users/resetPassword/${resetToken}`;

      await sendResetPasswordEmail(user.email, resetURL);

      res.status(200).json({
        status: "success",
        message: "密碼重設連結已發送到您的電子郵件",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "發送重設密碼郵件時發生錯誤，請稍後再試",
      });
    }
  }

  public async getLoginHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user._id;
      const loginHistory = await LoginHistory.find({ userId })
        .sort({ loginTime: -1 })
        .limit(10);

      const formattedHistory = loginHistory.map((record) => ({
        _id: record._id,
        status: record.status === "success" ? "成功" : "失敗", // 中文化狀態
        ipAddress: record.ipAddress,
        location: record.location
          ? `${record.location.country} ${record.location.region} ${record.location.city}`.trim()
          : "位置未知",
        userAgent: record.userAgent,
        failureReason: record.failureReason
          ? `失敗原因：${record.failureReason}`
          : undefined,
        loginTime: new Date(record.loginTime).toLocaleString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          weekday: "long", // 加入星期
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false, // 24小時制
          timeZone: "Asia/Taipei", // 確保使用台北時區
        }),
      }));

      res.status(200).json({
        status: "success",
        data: {
          loginHistory: formattedHistory,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private generateToken(user: IUser): string {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role || "user",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );
  }

  private getLocationInfo(ip: string) {
    // 如果是本地 IP，返回預設值
    if (ip === "::1" || ip === "127.0.0.1") {
      return {
        country: "本地",
        region: "本地",
        city: "本地開發環境",
      };
    }

    const geo = geoip.lookup(ip);
    if (geo) {
      return {
        country: geo.country,
        region: geo.region,
        city: geo.city,
      };
    }

    return {
      country: "未知",
      region: "未知",
      city: "未知",
    };
  }

  public deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { password } = req.body;
      const userId = req.user._id;

      // 查找用戶並包含密碼欄位
      const user = await User.findById(userId).select("+password");

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "找不到使用者",
        });
      }

      // 驗證密碼
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: "error",
          message: "密碼不正確",
        });
      }

      // 刪除用戶的登入歷史
      await LoginHistory.deleteMany({ userId });

      // 刪除用戶
      await User.findByIdAndDelete(userId);

      res.status(200).json({
        status: "success",
        message: "帳號已成功刪除",
      });
    } catch (error) {
      next(error);
    }
  };

  // 管理員更改用戶角色
  public updateUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId } = req.params;
      const { role, banReason, banDuration } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "找不到該用戶",
        });
      }

      // 設定新角色
      user.role = role;

      // 如果是停權操作
      if (role === "banned") {
        user.banReason = banReason;
        user.bannedAt = new Date();

        // 設定停權期限（如果有提供）
        if (banDuration) {
          user.bannedUntil = new Date(
            Date.now() + banDuration * 24 * 60 * 60 * 1000
          );
        }
      } else {
        // 如果是解除停權，清除相關欄位
        user.banReason = undefined;
        user.bannedAt = undefined;
        user.bannedUntil = undefined;
      }

      await user.save();

      res.status(200).json({
        status: "success",
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            banStatus:
              user.role === "banned"
                ? {
                    reason: user.banReason,
                    bannedAt: user.bannedAt,
                    bannedUntil: user.bannedUntil,
                  }
                : null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 獲取 Google 登入 URL
  public getGoogleAuthUrl = async (req: Request, res: Response) => {
    try {
      const url = userService.getGoogleAuthUrl();
      res.json({ url });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "獲取 Google 登入連結失敗",
      });
    }
  };

  // 處理 Google 登入
  public handleGoogleLogin = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const authResponse = await userService.googleLogin(token);

      res.json({
        status: "success",
        data: authResponse,
      });
    } catch (error) {
      res.status(401).json({
        status: "error",
        message: "Google 登入失敗",
      });
    }
  };

  // 處理 Google OAuth 回調
  public handleGoogleCallback = async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        throw new Error("未收到有效的授權碼");
      }

      const authResponse = await userService.handleGoogleCallback(code);

      res.json({
        status: "success",
        data: {
          token: authResponse.token,
          user: authResponse.user,
        },
      });
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/google/error`);
    }
  };

  // 1. 發送重設密碼驗證碼
  public async sendPasswordResetCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;
      console.log("收到重設密碼請求:", { email });

      if (!email) {
        console.log("缺少電子郵件地址");
        return res.status(400).json({
          status: "error",
          message: "請提供電子郵件地址",
        });
      }

      // 檢查用戶是否存在
      const user = await User.findOne({ email });
      console.log("查找用戶結果:", {
        email,
        userFound: !!user,
        timestamp: new Date().toISOString(),
      });
      if (!user) {
        console.log("用戶不存在:", { email });
        return res.status(404).json({
          status: "error",
          message: "找不到此電子郵件的使用者",
        });
      }

      // 使用 userService 發送驗證碼
      console.log("準備生成並發送驗證碼");
      const verificationCode = await userService.generateAndSaveResetCode(
        email
      );
      console.log("驗證碼已生成:", {
        email,
        timestamp: new Date().toISOString(),
      });
      await sendResetPasswordEmail(email, verificationCode);
      console.log("驗證碼郵件已發送:", {
        email,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        status: "success",
        message: "重設密碼驗證碼已發送到您的信箱",
      });
    } catch (error) {
      console.error("發送驗證碼過程中發生錯誤:", error);
      next(error);
    }
  }

  // 2. 驗證重設密碼驗證碼
  public async verifyPasswordResetCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          status: "error",
          message: "請提供電子郵件和驗證碼",
        });
      }

      const isValid = await userService.verifyResetCode(email, code);

      if (!isValid) {
        return res.status(400).json({
          status: "error",
          message: "驗證碼無效或已過期",
        });
      }

      res.status(200).json({
        status: "success",
        message: "驗證碼驗證成功",
      });
    } catch (error) {
      next(error);
    }
  }

  // 3. 使用驗證碼重設密碼
  public async resetPasswordWithCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          status: "error",
          message: "請提供所有必要資訊",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          status: "error",
          message: "新密碼長度至少需要 8 個字元",
        });
      }

      const success = await userService.resetPasswordWithCode(
        email,
        code,
        newPassword
      );

      if (!success) {
        return res.status(400).json({
          status: "error",
          message: "重設密碼失敗，請確認驗證碼是否正確且未過期",
        });
      }

      res.status(200).json({
        status: "success",
        message: "密碼重設成功",
      });
    } catch (error) {
      next(error);
    }
  }

  // 驗證手機號碼並更新用戶資料
  public async verifyPhoneNumber(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { phoneNumber, verificationId } = req.body;
      const userId = req.user._id; // 從驗證中間件獲取

      if (!phoneNumber || !verificationId) {
        return res.status(400).json({
          status: "error",
          message: "缺少必要參數",
        });
      }

      // 檢查該手機號碼是否已被其他用戶使用
      const existingUser = await User.findOne({
        phoneNumber,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          status: "error",
          message: "此手機號碼已被其他用戶使用",
        });
      }

      // 更新用戶的手機號碼驗證狀態
      const user = await User.findByIdAndUpdate(
        userId,
        {
          phoneNumber,
          isPhoneVerified: true,
          phoneVerificationId: verificationId,
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "找不到使用者",
        });
      }

      res.status(200).json({
        status: "success",
        message: "手機號碼驗證成功",
        data: {
          phoneNumber: user.phoneNumber,
          isPhoneVerified: user.isPhoneVerified,
        },
      });
    } catch (error) {
      console.error("手機驗證錯誤:", error);
      next(error);
    }
  }

  // 檢查手機號碼驗證狀態
  public async checkPhoneVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "找不到使用者",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          phoneNumber: user.phoneNumber,
          isPhoneVerified: user.isPhoneVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
