import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel";

// 擴展 Express 的 Request 介面，添加 user 屬性
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// 建立驗證中間件
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. 從請求標頭中取得 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("未提供認證 Token");
    }

    // 2. 取得並驗證 token
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: "user" | "admin" | "banned";
    };

    // 3. 查找使用者
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error("找不到使用者");
    }

    // 4. 將使用者資訊添加到請求物件中
    req.user = user;
    next();
  } catch (error) {
    // 5. 處理各種可能的錯誤
    if (error instanceof Error) {
      if (error.name === "JsonWebTokenError") {
        res.status(401).json({
          status: "error",
          message: "Token 無效",
        });
        return;
      }
      if (error.name === "TokenExpiredError") {
        res.status(401).json({
          status: "error",
          message: "Token 已過期",
        });
        return;
      }
    }

    res.status(401).json({
      status: "error",
      message: "未經授權的存取",
    });
  }
};
