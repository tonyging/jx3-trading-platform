// controllers/adminController.ts
import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import Product from "../models/productModel";
import Transaction from "../models/transactionModel";
import SystemLog from "../models/systemLogModel";
import { IUser } from "../models/userModel";
import mongoose from "mongoose";

class AdminController {
  // 獲取平台統計數據
  public async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 獲取統計數據
      const totalUsers = await User.countDocuments();
      const totalProducts = await Product.countDocuments();
      const activeProducts = await Product.countDocuments({ status: "active" });
      const totalTransactions = await Transaction.countDocuments();
      const completedTransactions = await Transaction.countDocuments({
        status: "completed",
      });

      res.status(200).json({
        status: "success",
        data: {
          totalUsers,
          totalProducts,
          activeProducts,
          totalTransactions,
          completedTransactions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 獲取用戶列表
  public async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 分頁參數
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 搜尋參數
      const query = req.query.query as string;
      let searchQuery = {};

      if (query) {
        searchQuery = {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        };
      }

      // 獲取用戶列表
      const users = await User.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // 獲取總用戶數
      const total = await User.countDocuments(searchQuery);

      res.status(200).json({
        status: "success",
        data: {
          users,
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
  }

  // 獲取用戶詳情
  public async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 獲取用戶詳情
      const userId = req.params.userId;
      const userDetail = await User.findById(userId);

      if (!userDetail) {
        return res.status(404).json({
          status: "error",
          message: "用戶不存在",
        });
      }

      res.status(200).json({
        status: "success",
        data: userDetail,
      });
    } catch (error) {
      next(error);
    }
  }

  // 獲取商品列表
  public async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 分頁參數
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 搜尋和過濾參數
      const query = req.query.query as string;
      const status = req.query.status as string;
      let searchQuery: any = {};

      if (query) {
        searchQuery.$or = [
          { characterNickname: { $regex: query, $options: "i" } },
        ];
      }

      if (status && status !== "all") {
        searchQuery.status = status;
      }

      // 獲取商品列表
      const products = await Product.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email");

      // 獲取總商品數
      const total = await Product.countDocuments(searchQuery);

      res.status(200).json({
        status: "success",
        data: {
          products,
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
  }

  // 獲取交易列表
  public async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 分頁參數
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 搜尋和過濾參數
      const status = req.query.status as string;
      let searchQuery: any = {};

      if (status && status !== "all") {
        searchQuery.status = status;
      }

      // 獲取交易列表
      const transactions = await Transaction.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("seller", "name email")
        .populate("buyer", "name email");

      // 獲取總交易數
      const total = await Transaction.countDocuments(searchQuery);

      res.status(200).json({
        status: "success",
        data: {
          transactions,
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
  }

  // 獲取系統日誌
  public async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 分頁參數
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // 獲取系統日誌
      const logs = await SystemLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // 獲取總日誌數
      const total = await SystemLog.countDocuments();

      res.status(200).json({
        status: "success",
        data: {
          logs,
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
  }

  // 搜尋用戶
  public async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 分頁和搜尋參數
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const query = req.query.query as string;

      // 構建搜尋條件
      let searchQuery = {};
      if (query) {
        searchQuery = {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        };
      }

      // 搜尋用戶
      const users = await User.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // 獲取總搜尋結果數
      const total = await User.countDocuments(searchQuery);

      res.status(200).json({
        status: "success",
        data: {
          users,
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
  }

  // 搜尋商品
  public async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 分頁和搜尋參數
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const query = req.query.query as string;

      // 構建搜尋條件
      let searchQuery: any = {};
      if (query) {
        searchQuery = {
          $or: [{ characterNickname: { $regex: query, $options: "i" } }],
        };
      }

      // 搜尋商品
      const products = await Product.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email");

      // 獲取總搜尋結果數
      const total = await Product.countDocuments(searchQuery);

      res.status(200).json({
        status: "success",
        data: {
          products,
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
  }

  // 搜尋交易
  public async searchTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // 確認是否為管理員
      const user = req.user as IUser;
      if (user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "無訪問權限",
        });
      }

      // 分頁和搜尋參數
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const query = req.query.query as string;

      // 構建搜尋條件
      let searchQuery: any = {};
      if (query) {
        // 嘗試將查詢轉換為 ObjectId（如果是有效的 ID）
        let transactionId;
        try {
          if (mongoose.Types.ObjectId.isValid(query)) {
            transactionId = new mongoose.Types.ObjectId(query);
          }
        } catch (error) {
          // 忽略無效的 ID
        }

        if (transactionId) {
          searchQuery._id = transactionId;
        } else {
          // 如果不是有效 ID，則搜尋其他欄位
          searchQuery.characterNickname = { $regex: query, $options: "i" };
        }
      }

      // 搜尋交易
      const transactions = await Transaction.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("seller", "name email")
        .populate("buyer", "name email");

      // 獲取總搜尋結果數
      const total = await Transaction.countDocuments(searchQuery);

      res.status(200).json({
        status: "success",
        data: {
          transactions,
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
  }
}

export default new AdminController();
