// controllers/appearanceController.ts
import { Request, Response, NextFunction } from "express";
import AppearanceSubmission from "../models/appearanceSubmissionModel";
import Appearance from "../models/appearanceModel";
import { Types } from "mongoose";
import SystemLog from "../models/systemLogModel";

class AppearanceController {
  // 提交新的外觀
  public submitAppearance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { officialName, nicknames, category } = req.body;

      // 驗證 category 是否在有效範圍內
      const validCategories = [
        "外觀禮盒",
        "上衣",
        "髮型",
        "披風",
        "頭飾",
        "背掛",
        "腰掛",
        "面掛",
        "肩飾",
        "眼飾",
        "手飾",
        "佩囊",
        "小頭像",
        "寵物",
        "掛寵",
        "坐騎",
        "馬具",
        "其他",
      ];

      if (!category || !validCategories.includes(category)) {
        return res.status(400).json({
          status: "error",
          message: "無效的外觀分類",
        });
      }

      const userId = req.user._id;

      // 檢查是否已有相同名稱的提交正在審核中
      const existingSubmission = await AppearanceSubmission.findOne({
        officialName,
        status: "pending",
      });
      if (existingSubmission) {
        return res.status(400).json({
          status: "error",
          message: "已有相同名稱的外觀正在審核中",
        });
      }

      // 創建新的外觀提交
      const submission = await AppearanceSubmission.create({
        officialName,
        nicknames: nicknames || [],
        category, // 加入 category
        submittedBy: userId,
        status: "pending",
        approvals: [],
        rejections: [],
      });

      // 記錄系統日誌
      await SystemLog.create({
        type: "appearance",
        action: "submit",
        userId,
        details: `提交了新外觀: ${officialName}`,
        ip: req.ip,
      });

      res.status(201).json({
        status: "success",
        data: {
          submission,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 獲取待審核的外觀列表
  public getPendingSubmissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user._id;

      // 查詢待審核的外觀，排除已經審核過的
      const submissions = await AppearanceSubmission.find({
        status: "pending",
        "approvals.userId": { $ne: userId }, // 排除已經批准過的
        "rejections.userId": { $ne: userId }, // 排除已經拒絕過的
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("submittedBy", "name email");

      const total = await AppearanceSubmission.countDocuments({
        status: "pending",
        submittedBy: { $ne: userId },
        "approvals.userId": { $ne: userId },
        "rejections.userId": { $ne: userId },
      });

      res.status(200).json({
        status: "success",
        data: {
          submissions,
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

  // 審核外觀提交
  public reviewSubmission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { submissionId } = req.params;
      const { action, comment, reason } = req.body;
      const userId = req.user._id;

      // 查找該提交
      const submission = await AppearanceSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的提交",
        });
      }

      // 檢查提交狀態
      if (submission.status !== "pending") {
        return res.status(400).json({
          status: "error",
          message: "該提交已被處理",
        });
      }

      // 檢查是否為自己的提交
      if (submission.submittedBy.toString() === userId.toString()) {
        return res.status(400).json({
          status: "error",
          message: "不能審核自己的提交",
        });
      }

      // 檢查是否已經審核過
      const hasApproved = submission.approvals.some(
        (approval) => approval.userId.toString() === userId.toString()
      );
      const hasRejected = submission.rejections.some(
        (rejection) => rejection.userId.toString() === userId.toString()
      );

      if (hasApproved || hasRejected) {
        return res.status(400).json({
          status: "error",
          message: "已經審核過此提交",
        });
      }

      // 根據操作執行相應邏輯
      if (action === "approve") {
        submission.approvals.push({
          userId: new Types.ObjectId(userId.toString()),
          timestamp: new Date(),
          comment,
        });

        // 檢查是否達到批准門檻（3個批准）
        if (submission.approvals.length >= 3) {
          submission.status = "approved";

          // 檢查是否已存在相同名稱的外觀
          let existingAppearance = await Appearance.findOne({
            officialName: submission.officialName,
          });

          if (existingAppearance) {
            // 合併 nicknames，去除重複
            const updatedNicknames = Array.from(
              new Set([
                ...existingAppearance.nicknames,
                ...(submission.nicknames || []),
              ])
            );

            // 更新現有的外觀
            existingAppearance = await Appearance.findOneAndUpdate(
              { officialName: submission.officialName },
              {
                nicknames: updatedNicknames,
                category: submission.category, // 直接覆蓋 category
                imageUrl: submission.imageUrl, // 如果需要更新圖片
              },
              { new: true }
            );
          } else {
            // 創建新的外觀記錄
            existingAppearance = await Appearance.create({
              officialName: submission.officialName,
              nicknames: submission.nicknames || [],
              imageUrl: submission.imageUrl,
              category: submission.category,
              submittedBy: submission.submittedBy,
              approvedBy: submission.approvals.map((a) => a.userId),
            });
          }

          // 記錄系統日誌
          await SystemLog.create({
            type: "appearance",
            action: "approve_final",
            userId,
            details: `外觀 ${submission.officialName} 已被批准並${
              existingAppearance ? "更新" : "添加"
            }到正式資料庫`,
            ip: req.ip,
          });
        }
      } else if (action === "reject") {
        if (!reason) {
          return res.status(400).json({
            status: "error",
            message: "拒絕時必須提供原因",
          });
        }

        // 直接將狀態設置為拒絕，不需要達到拒絕門檻
        submission.status = "rejected";

        submission.rejections.push({
          userId: new Types.ObjectId(userId.toString()),
          timestamp: new Date(),
          reason,
        });

        // 記錄系統日誌
        await SystemLog.create({
          type: "appearance",
          action: "reject_final",
          userId,
          details: `外觀 ${submission.officialName} 已被拒絕，原因：${reason}`,
          ip: req.ip,
        });
      } else {
        return res.status(400).json({
          status: "error",
          message: "無效的操作",
        });
      }

      await submission.save();

      // 記錄審核操作
      await SystemLog.create({
        type: "appearance",
        action:
          action === "approve" ? "approve_submission" : "reject_submission",
        userId,
        details: `${action === "approve" ? "批准" : "拒絕"}了外觀 ${
          submission.officialName
        } 的提交`,
        ip: req.ip,
      });

      res.status(200).json({
        status: "success",
        data: {
          submission,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 獲取外觀詳情
  public getAppearance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const appearance = await Appearance.findById(id)
        .populate("submittedBy", "name email")
        .populate("approvedBy", "name email");

      if (!appearance) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的外觀",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          appearance,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 搜尋外觀
  public searchAppearances = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { query } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query) {
        return res.status(400).json({
          status: "error",
          message: "請提供搜尋關鍵字",
        });
      }

      const queryRegex = new RegExp(query as string, "i");
      const appearances = await Appearance.find({
        $or: [{ officialName: queryRegex }, { nicknames: queryRegex }],
      })
        .sort({ officialName: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Appearance.countDocuments({
        $or: [{ officialName: queryRegex }, { nicknames: queryRegex }],
      });

      res.status(200).json({
        status: "success",
        data: {
          appearances,
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

  // 獲取所有外觀
  public getAllAppearances = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const appearances = await Appearance.find()
        .sort({ officialName: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Appearance.countDocuments();

      res.status(200).json({
        status: "success",
        data: {
          appearances,
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

  // 獲取用戶提交的外觀列表
  public getUserSubmissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      let query: any = { submittedBy: userId };
      if (status && ["pending", "approved", "rejected"].includes(status)) {
        query.status = status;
      }

      const submissions = await AppearanceSubmission.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await AppearanceSubmission.countDocuments(query);

      res.status(200).json({
        status: "success",
        data: {
          submissions,
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

  // 刪除提交的外觀
  public deleteSubmission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { submissionId } = req.params;
      const userId = req.user._id;

      // 查找該提交
      const submission = await AppearanceSubmission.findById(submissionId);

      if (!submission) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的提交",
        });
      }

      // 檢查是否為自己的提交
      if (submission.submittedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          status: "error",
          message: "無權刪除此提交",
        });
      }

      // 檢查狀態是否為 pending，只能刪除待審核的提交
      if (submission.status !== "pending") {
        return res.status(400).json({
          status: "error",
          message: "只能刪除待審核的提交",
        });
      }

      // 刪除提交
      await AppearanceSubmission.findByIdAndDelete(submissionId);

      // 記錄系統日誌
      await SystemLog.create({
        type: "appearance",
        action: "delete_submission",
        userId,
        details: `刪除了外觀提交: ${submission.officialName}`,
        ip: req.ip,
      });

      // 返回成功訊息
      res.status(200).json({
        status: "success",
        message: "已成功刪除提交",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AppearanceController();
