// services/activityTrackingService.ts
import { Request } from "express";
import UserActivity, { IUserActivity } from "../models/userActivityModel";
import { Types } from "mongoose";

class ActivityTrackingService {
  async trackActivity(
    userId: Types.ObjectId,
    actionType: string,
    targetType: "product" | "transaction" | "message",
    targetId: Types.ObjectId,
    metadata: any = {},
    req?: Request
  ) {
    try {
      const activityData = {
        userId,
        actionType,
        targetType,
        targetId,
        metadata,
        ipAddress: req?.ip,
        userAgent: req?.headers["user-agent"],
      };

      const activity = await UserActivity.create(activityData);
      return activity;
    } catch (error) {
      console.error("Error tracking activity:", error);
      // 不要讓追蹤失敗影響主要功能
      return null;
    }
  }

  async getUserActivities(
    userId: Types.ObjectId,
    options: {
      startDate?: Date;
      endDate?: Date;
      actionType?: string;
      targetType?: string;
      limit?: number;
      page?: number;
    }
  ) {
    const query: any = { userId };

    if (options.startDate) {
      query.createdAt = { $gte: options.startDate };
    }
    if (options.endDate) {
      query.createdAt = { ...query.createdAt, $lte: options.endDate };
    }
    if (options.actionType) {
      query.actionType = options.actionType;
    }
    if (options.targetType) {
      query.targetType = options.targetType;
    }

    const limit = options.limit || 10;
    const skip = ((options.page || 1) - 1) * limit;

    return UserActivity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("targetId");
  }

  async getActivityStatistics(
    userId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ) {
    const stats = await UserActivity.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$actionType",
          count: { $sum: 1 },
        },
      },
    ]);

    return stats;
  }
}

export default new ActivityTrackingService();
