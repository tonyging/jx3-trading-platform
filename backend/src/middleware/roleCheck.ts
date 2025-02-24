// middleware/roleCheck.ts
import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/userModel";

// 檢查是否為管理員
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as IUser;

    if (user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "需要管理員權限",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 檢查用戶是否被停權
export const checkBanStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as IUser;

    if (user.isBanned()) {
      const banMessage = user.bannedUntil
        ? `帳號已被停權至 ${user.bannedUntil.toLocaleDateString()}`
        : "帳號已被永久停權";

      return res.status(403).json({
        status: "error",
        message: banMessage,
        details: {
          reason: user.banReason,
          bannedAt: user.bannedAt,
          bannedUntil: user.bannedUntil,
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
