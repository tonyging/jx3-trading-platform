// controllers/appearanceTradeController.ts
import { Request, Response, NextFunction } from "express";
import AppearanceTrade from "../models/appearanceProductModel";
import Appearance from "../models/appearanceModel";
import SystemLog from "../models/systemLogModel";
import { Types } from "mongoose";
import { IUser } from "../models/userModel";

class AppearanceTradeController {
  // 獲取交易列表
  public getAppearanceTrades = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        page = "1",
        limit = "10",
        sortBy = "createdAt",
        order = "desc",
        status,
        sellerId,
        buyerId,
        appearanceId,
        minPrice,
        maxPrice,
      } = req.query;

      // 構建查詢條件
      const query: Record<string, any> = {};

      if (
        (status === "trading" || status === "completed") &&
        sellerId &&
        buyerId &&
        sellerId === buyerId
      ) {
        const userId = new Types.ObjectId(sellerId as string);
        query.$or = [
          { sellerId: userId, status: status },
          { buyerId: userId, status: status },
        ];
      } else {
        // 處理賣家過濾
        if (sellerId) {
          query.sellerId = new Types.ObjectId(sellerId as string);
        }

        // 處理買家過濾
        if (buyerId) {
          query.buyerId = new Types.ObjectId(buyerId as string);
        }
      }

      // 處理狀態過濾
      if (status) {
        if (Array.isArray(status)) {
          query.status = { $in: status };
        } else {
          query.status = status;
        }
      }

      // 處理外觀過濾
      if (appearanceId) {
        query.appearanceId = new Types.ObjectId(appearanceId as string);
      }

      // 處理價格範圍過濾
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) {
          query.price.$gte = Number(minPrice);
        }
        if (maxPrice !== undefined) {
          query.price.$lte = Number(maxPrice);
        }
      }

      // 排序設定
      const sortOption: Record<string, 1 | -1> = {
        [sortBy as string]: order === "asc" ? 1 : -1,
      };

      // 總數記錄
      const total = await AppearanceTrade.countDocuments(query);

      // 分頁查詢
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const trades = await AppearanceTrade.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate("sellerId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(200).json({
        status: "success",
        data: {
          trades,
          pagination: {
            current: pageNum,
            total: Math.ceil(total / limitNum),
            totalRecords: total,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 創建交易
  public createAppearanceTrade = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        appearanceId,
        price,
        characterNickname,
        paymentMethods,
        currency,
      } = req.body;
      const sellerId = req.user._id;

      // 檢查必要欄位
      if (
        !appearanceId ||
        !price ||
        !characterNickname ||
        !paymentMethods ||
        !currency
      ) {
        return res.status(400).json({
          status: "error",
          message: "所有必要欄位都必須提供",
        });
      }

      // 驗證外觀是否存在
      const appearance = await Appearance.findById(appearanceId);
      if (!appearance) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的外觀",
        });
      }

      // 驗證支付方式
      if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "至少需要提供一種交易方式",
        });
      }

      // 創建交易
      const trade = await AppearanceTrade.create({
        sellerId,
        appearanceId,
        price,
        characterNickname,
        paymentMethods,
        currency,
        status: "pending",
        sellerConfirmed: false,
        buyerConfirmed: false,
      });

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action: "create_trade",
        userId: sellerId,
        details: `創建了外觀交易：${appearance.officialName}，價格：${price}${currency}`,
        ip: req.ip,
      });

      // 查詢填充後的交易數據
      const populatedTrade = await AppearanceTrade.findById(trade._id)
        .populate("sellerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(201).json({
        status: "success",
        data: {
          trade: populatedTrade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 獲取特定交易詳情
  public getAppearanceTradeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const trade = await AppearanceTrade.findById(id)
        .populate("sellerId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("appearanceId");

      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          trade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 預訂交易
  public reserveAppearanceTrade = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;
      const buyerId = req.user._id;

      // 檢查支付方式是否提供
      if (!paymentMethod) {
        return res.status(400).json({
          status: "error",
          message: "必須指定支付方式",
        });
      }

      // 查找交易
      const trade = await AppearanceTrade.findById(id);
      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      // 檢查交易狀態
      if (trade.status !== "pending") {
        return res.status(400).json({
          status: "error",
          message: `交易狀態為 ${trade.status}，無法預訂`,
        });
      }

      // 檢查是否為自己的交易
      if (trade.sellerId.toString() === buyerId.toString()) {
        return res.status(400).json({
          status: "error",
          message: "不能預訂自己的交易",
        });
      }

      // 檢查支付方式是否被賣家接受
      if (!trade.paymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          status: "error",
          message: "賣家不接受此支付方式",
        });
      }

      // 更新交易
      trade.buyerId = buyerId;
      trade.status = "trading";
      trade.selectedPaymentMethod = paymentMethod;
      await trade.save();

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action: "reserve_trade",
        userId: buyerId,
        details: `預訂了外觀交易 ${id}，選擇支付方式：${paymentMethod}`,
        ip: req.ip,
      });

      // 返回更新後的交易
      const updatedTrade = await AppearanceTrade.findById(id)
        .populate("sellerId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(200).json({
        status: "success",
        data: {
          trade: updatedTrade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 發送交易訊息
  public sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user._id;

      // 檢查訊息內容
      if (!content || content.trim() === "") {
        return res.status(400).json({
          status: "error",
          message: "訊息內容不能為空",
        });
      }

      // 查找交易
      const trade = await AppearanceTrade.findById(id);
      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      // 檢查使用者是否為交易的買家或賣家
      const isSeller = trade.sellerId.toString() === userId.toString();
      const isBuyer =
        trade.buyerId && trade.buyerId.toString() === userId.toString();

      if (!isSeller && !isBuyer) {
        return res.status(403).json({
          status: "error",
          message: "只有交易參與者可以發送訊息",
        });
      }

      // 添加訊息
      const message = {
        sender: userId,
        content: content.trim(),
        timestamp: new Date(),
      };

      if (!trade.messages) {
        trade.messages = [];
      }
      trade.messages.push(message);
      await trade.save();

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action: "send_message",
        userId,
        details: `在外觀交易 ${id} 中發送了訊息`,
        ip: req.ip,
      });

      // 返回更新後的交易
      const updatedTrade = await AppearanceTrade.findById(id)
        .populate("sellerId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(200).json({
        status: "success",
        data: {
          trade: updatedTrade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 上傳付款證明
  public uploadPaymentProof = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;
      const userId = req.user._id;

      // 檢查圖片URL
      if (!imageUrl) {
        return res.status(400).json({
          status: "error",
          message: "必須提供付款證明圖片URL",
        });
      }

      // 查找交易
      const trade = await AppearanceTrade.findById(id);
      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      // 檢查使用者是否為買家
      if (!trade.buyerId || trade.buyerId.toString() !== userId.toString()) {
        return res.status(403).json({
          status: "error",
          message: "只有買家可以上傳付款證明",
        });
      }

      // 檢查交易狀態
      if (trade.status !== "trading") {
        return res.status(400).json({
          status: "error",
          message: `交易狀態為 ${trade.status}，無法上傳付款證明`,
        });
      }

      // 更新交易
      trade.paymentProof = {
        imageUrl,
        uploadTime: new Date(),
      };
      trade.status = "pending_confirmation";
      await trade.save();

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action: "upload_payment_proof",
        userId,
        details: `為外觀交易 ${id} 上傳了付款證明`,
        ip: req.ip,
      });

      // 返回更新後的交易
      const updatedTrade = await AppearanceTrade.findById(id)
        .populate("sellerId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(200).json({
        status: "success",
        data: {
          trade: updatedTrade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 賣家確認交易
  public sellerConfirmTrade = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      // 查找交易
      const trade = await AppearanceTrade.findById(id);
      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      // 檢查使用者是否為賣家
      if (trade.sellerId.toString() !== userId.toString()) {
        return res.status(403).json({
          status: "error",
          message: "只有賣家可以確認交易",
        });
      }

      // 檢查交易狀態
      if (
        trade.status !== "trading" &&
        trade.status !== "pending_confirmation"
      ) {
        return res.status(400).json({
          status: "error",
          message: `交易狀態為 ${trade.status}，賣家不能確認交易`,
        });
      }

      // 更新交易
      trade.sellerConfirmed = true;

      // 如果買家已確認，更新交易狀態為已完成
      if (trade.buyerConfirmed) {
        trade.status = "completed";
        trade.completedAt = new Date();
      }

      await trade.save();

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action:
          trade.status === "completed" ? "complete_trade" : "seller_confirm",
        userId,
        details:
          trade.status === "completed"
            ? `外觀交易 ${id} 已完成`
            : `賣家確認了外觀交易 ${id}`,
        ip: req.ip,
      });

      // 返回更新後的交易
      const updatedTrade = await AppearanceTrade.findById(id)
        .populate("sellerId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(200).json({
        status: "success",
        data: {
          trade: updatedTrade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 買家確認交易
  public buyerConfirmTrade = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      // 查找交易
      const trade = await AppearanceTrade.findById(id);
      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      // 檢查使用者是否為買家
      if (!trade.buyerId || trade.buyerId.toString() !== userId.toString()) {
        return res.status(403).json({
          status: "error",
          message: "只有買家可以確認交易",
        });
      }

      // 檢查交易狀態
      if (
        trade.status !== "trading" &&
        trade.status !== "pending_confirmation"
      ) {
        return res.status(400).json({
          status: "error",
          message: `交易狀態為 ${trade.status}，買家不能確認交易`,
        });
      }

      // 更新交易
      trade.buyerConfirmed = true;

      // 如果賣家已確認，更新交易狀態為已完成
      if (trade.sellerConfirmed) {
        trade.status = "completed";
        trade.completedAt = new Date();
      }

      await trade.save();

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action:
          trade.status === "completed" ? "complete_trade" : "buyer_confirm",
        userId,
        details:
          trade.status === "completed"
            ? `外觀交易 ${id} 已完成`
            : `買家確認了外觀交易 ${id}`,
        ip: req.ip,
      });

      // 返回更新後的交易
      const updatedTrade = await AppearanceTrade.findById(id)
        .populate("sellerId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(200).json({
        status: "success",
        data: {
          trade: updatedTrade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 取消交易
  public cancelTrade = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user._id;

      // 查找交易
      const trade = await AppearanceTrade.findById(id);
      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      // 檢查使用者是否為交易參與者
      const isSeller = trade.sellerId.toString() === userId.toString();
      const isBuyer =
        trade.buyerId && trade.buyerId.toString() === userId.toString();

      if (!isSeller && !isBuyer) {
        return res.status(403).json({
          status: "error",
          message: "只有交易參與者可以取消交易",
        });
      }

      // 檢查交易狀態
      if (
        trade.status !== "trading" &&
        trade.status !== "pending_confirmation"
      ) {
        return res.status(400).json({
          status: "error",
          message: `交易狀態為 ${trade.status}，無法取消交易`,
        });
      }

      // 更新交易
      trade.status = "cancelled";
      trade.cancelledAt = new Date();

      // 如果提供了取消原因，添加一條訊息
      if (reason) {
        if (!trade.messages) {
          trade.messages = [];
        }

        trade.messages.push({
          sender: userId,
          content: `取消原因: ${reason}`,
          timestamp: new Date(),
        });
      }

      await trade.save();

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action: "cancel_trade",
        userId,
        details: `${isSeller ? "賣家" : "買家"}取消了外觀交易 ${id}${
          reason ? `，原因：${reason}` : ""
        }`,
        ip: req.ip,
      });

      // 返回更新後的交易
      const updatedTrade = await AppearanceTrade.findById(id)
        .populate("sellerId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(200).json({
        status: "success",
        data: {
          trade: updatedTrade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 更新交易
  public updateTrade = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { price, paymentMethods } = req.body;
      const userId = req.user._id;

      // 查找交易
      const trade = await AppearanceTrade.findById(id);
      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      // 檢查使用者是否為賣家
      if (trade.sellerId.toString() !== userId.toString()) {
        return res.status(403).json({
          status: "error",
          message: "只有賣家可以更新交易",
        });
      }

      // 檢查交易狀態
      if (trade.status !== "pending") {
        return res.status(400).json({
          status: "error",
          message: `交易狀態為 ${trade.status}，無法更新交易`,
        });
      }

      // 更新價格
      if (price !== undefined) {
        trade.price = price;
      }

      // 更新支付方式
      if (paymentMethods !== undefined) {
        if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
          return res.status(400).json({
            status: "error",
            message: "至少需要提供一種交易方式",
          });
        }
        trade.paymentMethods = paymentMethods;
      }

      await trade.save();

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action: "update_trade",
        userId,
        details: `更新了外觀交易 ${id} 的信息`,
        ip: req.ip,
      });

      // 返回更新後的交易
      const updatedTrade = await AppearanceTrade.findById(id)
        .populate("sellerId", "name email contactInfo")
        .populate("appearanceId");

      res.status(200).json({
        status: "success",
        data: {
          trade: updatedTrade,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 刪除交易
  public deleteTrade = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const isAdmin = (req.user as IUser).role === "admin";

      // 查找交易
      const trade = await AppearanceTrade.findById(id);
      if (!trade) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定的交易",
        });
      }

      // 檢查權限
      const isSeller = trade.sellerId.toString() === userId.toString();

      if (!isSeller && !isAdmin) {
        return res.status(403).json({
          status: "error",
          message: "只有賣家或管理員可以刪除交易",
        });
      }

      // 對於非管理員，檢查交易狀態
      if (!isAdmin && trade.status !== "pending") {
        return res.status(400).json({
          status: "error",
          message: `交易狀態為 ${trade.status}，只能刪除待交易狀態的交易`,
        });
      }

      // 更新交易狀態為已刪除
      trade.status = "deleted";

      // 如果是管理員刪除，記錄額外資訊
      if (isAdmin) {
        trade.adminDeletedAt = new Date();
        trade.adminDeletedBy = userId;
      }

      await trade.save();

      // 系統日誌記錄
      await SystemLog.create({
        type: "appearance",
        action: "delete_trade",
        userId,
        details: `${isAdmin ? "管理員" : "賣家"}刪除了外觀交易 ${id}`,
        ip: req.ip,
      });

      res.status(200).json({
        status: "success",
        message: "交易已成功刪除",
        data: {
          trade: { _id: id },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AppearanceTradeController();
