// middleware/activityTracking.ts
import { Request, Response, NextFunction } from "express";
import activityTrackingService from "../services/activityTrackingService";
import { Types } from "mongoose";

export const trackProductView = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.id;
    const userId = req.user?._id;

    if (userId && productId) {
      // 非同步追蹤但不等待完成
      activityTrackingService
        .trackActivity(
          userId,
          "VIEW_PRODUCT",
          "product",
          new Types.ObjectId(productId),
          {},
          req
        )
        .catch((error) => {
          console.error("Error tracking product view:", error);
        });
    }
    next();
  } catch (error) {
    // 即使追蹤失敗也繼續執行
    next();
  }
};
