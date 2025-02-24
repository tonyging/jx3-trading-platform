import { Request, Response, NextFunction } from "express";
import Product, { IProduct } from "../models/productModel";
import Transaction from "../models/transactionModel";
import mongoose, { Types } from "mongoose";
import User, { IUser } from "../models/userModel";
import activityTrackingService from "../services/activityTrackingService";

interface IProductQueryParams {
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: string;
  tab?: string;
  userId?: string;
  buyerId?: string;
}

class ProductController {
  // 建立新商品
  public createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { amount, price } = req.body;

      const product = await Product.create({
        userId: Types.ObjectId.createFromHexString(req.user._id.toString()),
        amount,
        price,
      });

      // 追蹤商品創建行為
      await activityTrackingService.trackActivity(
        req.user._id,
        "CREATE_PRODUCT",
        "product",
        product._id,
        {
          amount,
          price,
        },
        req
      );

      res.status(201).json({
        status: "success",
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 獲取商品列表（支援分頁和排序）
  public getProducts = async (
    req: Request<{}, {}, {}, IProductQueryParams>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page || "1");
      const limit = parseInt(req.query.limit || "10");
      let sortBy = req.query.sortBy || "ratio";
      const order = (req.query.order || "desc") as "asc" | "desc";
      const tab = req.query.tab || "all";
      const userId = req.query.userId;
      const buyerId = req.query.buyerId;

      if (sortBy === "value") {
        sortBy = "ratio";
      }

      const validSortFields = ["amount", "price", "ratio", "createdAt"];
      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({
          status: "error",
          message: "無效的排序欄位",
        });
      }

      let query: Record<string, any> = {};

      // 根據不同的 tab 設定查詢條件
      switch (tab) {
        case "trading":
          // 交易中頁籤的查詢邏輯
          if (userId) {
            query.$or = [
              {
                userId: Types.ObjectId.createFromHexString(userId),
                status: "reserved",
              },
              {
                buyerId: Types.ObjectId.createFromHexString(userId),
                status: "reserved",
              },
            ];
          }
          break;
        case "my":
          // 我的商品頁籤
          query.$and = [
            { userId: Types.ObjectId.createFromHexString(userId as string) },
            { status: "active" },
          ];
          break;
        case "admin":
          // 管理員頁籤：顯示除了 deleted 以外的所有商品
          query.status = { $ne: "deleted" };
          break;
        default:
          // 全部商品頁籤
          query.status = "active";
      }

      const sortOption: { [key: string]: "asc" | "desc" } = {
        [sortBy]: order,
      };

      const products = await Product.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate({
          path: "transactionId",
          model: "Transaction",
          select: "_id status createdAt",
        });

      const total = await Product.countDocuments(query);

      const enhancedProducts = products.map((product) => {
        if (product.status === "reserved" && !product.transactionId) {
          console.warn(
            "Found reserved product without transactionId:",
            product._id
          );
        }
        return product;
      });

      res.status(200).json({
        status: "success",
        data: {
          products: enhancedProducts,
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

  // 買家保留商品
  public reserveProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const buyerId = req.user._id;

      // 先檢查商品是否存在
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          status: "error",
          message: "找不到指定商品",
        });
      }

      // 檢查商品狀態
      if (existingProduct.status !== "active") {
        return res.status(400).json({
          status: "error",
          message: `商品目前狀態為 ${existingProduct.status}，無法購買`,
        });
      }

      // 檢查是否為自己的商品
      if (existingProduct.userId.toString() === buyerId.toString()) {
        return res.status(400).json({
          status: "error",
          message: "不能購買自己的商品",
        });
      }

      // 創建交易記錄
      const transaction = await Transaction.create({
        seller: existingProduct.userId,
        buyer: buyerId,
        product: existingProduct._id,
        amount: existingProduct.amount,
        price: existingProduct.price,
        status: "reserved",
      });

      // 分兩步驟更新商品資訊
      // 1. 先更新商品狀態和關聯
      await Product.updateOne(
        {
          _id: new Types.ObjectId(id),
          status: "active",
          userId: { $ne: buyerId },
        },
        {
          $set: {
            status: "reserved",
            buyerId: new Types.ObjectId(buyerId),
            transactionId: transaction._id,
          },
        }
      );

      // 2. 然後重新查詢商品以獲取完整資訊
      const updatedProduct = await Product.findById(id)
        .populate("userId", "name email contactInfo")
        .populate("buyerId", "name email contactInfo")
        .populate("transactionId"); // 添加交易資訊的填充

      if (!updatedProduct || updatedProduct.status !== "reserved") {
        // 如果更新失敗，回滾交易記錄
        await Transaction.findByIdAndDelete(transaction._id);

        return res.status(400).json({
          status: "error",
          message: "商品不可購買或已被其他買家預訂",
        });
      }

      // 添加一些日誌來確認資訊是否正確設置
      console.log("Reserved product details:", {
        productId: updatedProduct._id,
        status: updatedProduct.status,
        transactionId: updatedProduct.transactionId,
        buyerId: updatedProduct.buyerId,
      });

      res.status(200).json({
        status: "success",
        data: {
          product: updatedProduct,
          transaction,
        },
      });
    } catch (error) {
      console.error("預訂商品時發生錯誤:", error);
      if (error instanceof Error) {
        return res.status(500).json({
          status: "error",
          message: `預訂商品失敗: ${error.message}`,
        });
      }
      next(error);
    }
  };

  // 更新商品
  public updateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { amount, price, status } = req.body;

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "找不到該商品",
        });
      }

      if (product.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: "error",
          message: "沒有權限更新此商品",
        });
      }

      const updates: Partial<IProduct> = {};
      if (amount !== undefined) updates.amount = amount;
      if (price !== undefined) updates.price = price;
      if (status !== undefined) updates.status = status;

      const updatedProduct = (await Product.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean()) as IProduct & { _id: Types.ObjectId };

      // 追蹤商品更新行為
      await activityTrackingService.trackActivity(
        req.user._id,
        "UPDATE_PRODUCT",
        "product",
        updatedProduct._id,
        {
          updates,
          previousValues: {
            amount: product.amount,
            price: product.price,
            status: product.status,
          },
        },
        req
      );

      res.status(200).json({
        status: "success",
        data: {
          product: updatedProduct,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 刪除商品
  public deleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const currentUser = req.user as IUser;

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "找不到該商品",
        });
      }

      if (currentUser.role !== "admin") {
        if (product.userId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            status: "error",
            message: "沒有權限刪除此商品",
          });
        }

        if (product.status !== "active") {
          return res.status(400).json({
            status: "error",
            message: "只有狀態為 active 的商品可以被刪除",
          });
        }
      }

      product.status = "deleted";
      await product.save();

      // 追蹤商品刪除行為
      await activityTrackingService.trackActivity(
        req.user._id,
        "DELETE_PRODUCT",
        "product",
        product._id,
        {
          previousStatus: product.status,
        },
        req
      );

      res.status(200).json({
        status: "success",
        message: "商品已成功刪除",
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ProductController();
