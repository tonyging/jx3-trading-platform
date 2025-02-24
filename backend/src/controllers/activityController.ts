// controllers/activityController.ts
import { Request, Response, NextFunction } from "express";
import UserActivity from "../models/userActivityModel";
import { Types } from "mongoose";

class ActivityController {
  // 管理員獲取所有活動記錄
  public getAllActivities = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const actionType = req.query.actionType as string;
      const userId = req.query.userId as string;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const query: any = {};

      if (actionType) {
        query.actionType = actionType;
      }
      if (userId) {
        query.userId = new Types.ObjectId(userId);
      }
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const activities = await UserActivity.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name email")
        .populate("targetId");

      const total = await UserActivity.countDocuments(query);

      res.status(200).json({
        status: "success",
        data: {
          activities,
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            totalRecords: total,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 用戶獲取自己的活動記錄
  public getUserActivities = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const actionType = req.query.actionType as string;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const query: any = {
        userId: req.user._id,
      };

      if (actionType) {
        query.actionType = actionType;
      }
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const activities = await UserActivity.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("targetId");

      const total = await UserActivity.countDocuments(query);

      res.status(200).json({
        status: "success",
        data: {
          activities,
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            totalRecords: total,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 取得活動統計
  public getActivityStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req.query.userId as string) || req.user._id;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 預設30天
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const stats = await UserActivity.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId.toString()),
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              actionType: "$actionType",
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.date": 1,
          },
        },
      ]);

      res.status(200).json({
        status: "success",
        data: {
          stats,
          dateRange: {
            start: startDate,
            end: endDate,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ActivityController();
