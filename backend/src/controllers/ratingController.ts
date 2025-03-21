import { Request, Response, NextFunction } from "express";
import Rating from "../models/ratingModel";
import User from "../models/userModel";
import { Types } from "mongoose";

class RatingController {
  // 創建評價
  public createRating = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { toUserId, score, comment, transactionId } = req.body;
      const fromUserId = req.user._id;

      // 檢查是否已經評價過此交易
      const existingRating = await Rating.findOne({
        fromUser: fromUserId,
        transactionId,
        isDeleted: false,
      });

      if (existingRating) {
        return res.status(400).json({
          status: "error",
          message: "已經對此交易評價過",
        });
      }

      // 檢查是否評價自己
      if (fromUserId.toString() === toUserId) {
        return res.status(400).json({
          status: "error",
          message: "不能評價自己",
        });
      }

      // 檢查被評價的用戶是否存在
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({
          status: "error",
          message: "找不到被評價的用戶",
        });
      }

      // 創建評價
      const rating = await Rating.create({
        fromUser: fromUserId,
        toUser: toUserId,
        transactionId,
        score,
        comment,
      });

      // 更新用戶的評價統計
      const userRatings = await Rating.find({
        toUser: toUserId,
        isDeleted: false,
      });

      const totalScore = userRatings.reduce(
        (sum, rating) => sum + rating.score,
        0
      );
      const averageRating = totalScore / userRatings.length;

      await User.findByIdAndUpdate(toUserId, {
        averageRating: Number(averageRating.toFixed(2)),
        totalRatings: userRatings.length,
      });

      res.status(201).json({
        status: "success",
        data: {
          rating,
        },
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
        message: "創建評價時發生錯誤",
      });
    }
  };

  // 獲取用戶的評價列表
  public getUserRatings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const ratings = await Rating.find({
        toUser: userId,
        isDeleted: false,
      })
        .populate("fromUser", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Rating.countDocuments({
        toUser: userId,
        isDeleted: false,
      });

      res.status(200).json({
        status: "success",
        data: {
          ratings,
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            totalRecords: total,
          },
        },
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
        message: "獲取評價列表時發生錯誤",
      });
    }
  };

  // 刪除評價（軟刪除）
  public deleteRating = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { ratingId } = req.params;
      const userId = req.user._id;

      const rating = await Rating.findById(ratingId);

      if (!rating) {
        return res.status(404).json({
          status: "error",
          message: "找不到該評價",
        });
      }

      // 檢查是否為評價的創建者
      if (rating.fromUser.toString() !== userId.toString()) {
        return res.status(403).json({
          status: "error",
          message: "沒有權限刪除此評價",
        });
      }

      // 軟刪除評價
      rating.isDeleted = true;
      await rating.save();

      // 重新計算用戶評價統計
      const userRatings = await Rating.find({
        toUser: rating.toUser,
        isDeleted: false,
      });

      const totalScore = userRatings.reduce((sum, r) => sum + r.score, 0);
      const averageRating =
        userRatings.length > 0 ? totalScore / userRatings.length : 0;

      await User.findByIdAndUpdate(rating.toUser, {
        averageRating: Number(averageRating.toFixed(2)),
        totalRatings: userRatings.length,
      });

      res.status(200).json({
        status: "success",
        message: "評價已刪除",
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
        message: "刪除評價時發生錯誤",
      });
    }
  };

  // 檢查是否已評價
  public checkRatingExists = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { transactionId, fromUserId } = req.query;

      if (!transactionId || !fromUserId) {
        return res.status(400).json({
          status: "error",
          message: "缺少必要參數",
        });
      }

      const existingRating = await Rating.findOne({
        fromUser: fromUserId,
        transactionId: transactionId as string,
        isDeleted: false,
      });

      res.status(200).json({
        status: "success",
        exists: !!existingRating,
      });
    } catch (error) {
      next(error);
    }
  };

  // 獲取特定交易的評價
  public getTransactionRating = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { transactionId } = req.params;

      const rating = await Rating.findOne({
        transactionId: new Types.ObjectId(transactionId),
        isDeleted: false,
      });

      if (!rating) {
        return res.status(404).json({
          status: "error",
          message: "找不到該交易的評價",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          rating: {
            score: rating.score,
            comment: rating.comment,
            createdAt: rating.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new RatingController();
