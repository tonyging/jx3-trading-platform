import { Request, Response, NextFunction } from "express";
import Transaction from "../models/transactionModel";
import Product from "../models/productModel";
import { Types } from "mongoose";
import User, { IUser } from "../models/userModel";
import activityTrackingService from "../services/activityTrackingService";

class TransactionController {
  // 獲取交易詳情
  public getTransactionDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findById(id)
        .populate("seller", "name email contactInfo")
        .populate("buyer", "name email")
        .populate("product", "amount price");

      if (!transaction) {
        return res.status(404).json({
          status: "error",
          message: "找不到該交易",
        });
      }

      res.status(200).json({
        status: "success",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  // 發送訊息
  public sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({
          status: "error",
          message: "找不到該交易",
        });
      }

      transaction.messages.push({
        sender: req.user._id,
        content,
        timestamp: new Date(),
      });

      await transaction.save();

      // 追蹤發送訊息行為
      await activityTrackingService.trackActivity(
        req.user._id,
        "SEND_MESSAGE",
        "transaction",
        transaction._id as Types.ObjectId,
        {
          content,
          timestamp: new Date(),
        },
        req
      );

      res.status(200).json({
        status: "success",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  // 上傳匯款證明
  public uploadPaymentProof = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          status: "error",
          message: "未上傳檔案",
        });
      }

      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({
          status: "error",
          message: "找不到該交易",
        });
      }

      // 確認上傳者是買家
      if (transaction.buyer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: "error",
          message: "無權上傳匯款證明",
        });
      }

      transaction.paymentProof = {
        imageUrl: file.path, // 假設使用檔案上傳中間件儲存檔案路徑
        uploadTime: new Date(),
      };

      transaction.status = "pending_payment";

      await transaction.save();

      // 追蹤上傳匯款證明行為
      await activityTrackingService.trackActivity(
        req.user._id,
        "UPLOAD_PAYMENT_PROOF",
        "transaction",
        transaction._id as Types.ObjectId,
        {
          imageUrl: file.path,
          uploadTime: new Date(),
          newStatus: "pending_payment",
        },
        req
      );

      res.status(200).json({
        status: "success",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  // 確認交易
  public confirmTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({
          status: "error",
          message: "找不到該交易",
        });
      }

      // 只有賣家可以確認交易
      if (transaction.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: "error",
          message: "無權確認交易",
        });
      }

      // 追蹤交易狀態更新
      await activityTrackingService.trackActivity(
        req.user._id,
        "UPDATE_TRANSACTION_STATUS",
        "transaction",
        transaction._id as Types.ObjectId,
        {
          previousStatus: transaction.status,
          newStatus: "completed",
          type: "confirmation",
        },
        req
      );

      // 更新交易狀態
      transaction.status = "completed";
      await transaction.save();

      // 更新商品狀態
      const product = await Product.findById(transaction.product);
      if (product) {
        // 如果是全部交易，則將商品狀態設為 sold
        if (product.amount === transaction.amount) {
          product.status = "sold";
        } else {
          // 部分交易，扣除已售出的數量
          product.amount -= transaction.amount;
        }
        await product.save();
      }

      res.status(200).json({
        status: "success",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  // 取消交易
  public cancelTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({
          status: "error",
          message: "找不到該交易",
        });
      }

      // 檢查是否有權限取消
      const isSellerOrBuyer =
        transaction.seller.toString() === req.user._id.toString() ||
        transaction.buyer.toString() === req.user._id.toString();

      if (!isSellerOrBuyer) {
        return res.status(403).json({
          status: "error",
          message: "無權取消交易",
        });
      }

      transaction.status = "cancelled";
      await transaction.save();

      await activityTrackingService.trackActivity(
        req.user._id,
        "CANCEL_TRANSACTION",
        "transaction",
        transaction._id as Types.ObjectId,
        {
          previousStatus: transaction.status,
          cancelledBy: req.user._id,
          isSellerCancel:
            transaction.seller.toString() === req.user._id.toString(),
        },
        req
      );

      res.status(200).json({
        status: "success",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  // 獲取用戶交易列表
  public getUserTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const query: any = {
        $or: [{ seller: req.user._id }, { buyer: req.user._id }],
      };

      if (status) {
        query.status = status;
      }

      const transactions = await Transaction.find(query)
        .populate("seller", "name email")
        .populate("buyer", "name email")
        .populate("product", "amount price")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Transaction.countDocuments(query);

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
  };

  public completeTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const transactionId = req.params.id;
      const currentUser = req.user as IUser;

      console.log("後端收到確認交易請求: ", currentUser);

      // 查找交易
      const transaction = await Transaction.findById(transactionId);

      if (!transaction) {
        return res.status(404).json({
          status: "error",
          message: "找不到交易",
        });
      }

      // 驗證使用者是否為交易參與者
      const isSeller =
        transaction.seller.toString() === currentUser._id.toString();
      const isBuyer =
        transaction.buyer.toString() === currentUser._id.toString();

      if (!isSeller && !isBuyer) {
        return res.status(403).json({
          status: "error",
          message: "您無權操作此交易",
        });
      }

      // 更新確認狀態
      if (isSeller) {
        transaction.sellerConfirmed = true;
      }
      if (isBuyer) {
        transaction.buyerConfirmed = true;
      }

      // 檢查是否雙方都已確認
      if (transaction.sellerConfirmed && transaction.buyerConfirmed) {
        // 追蹤雙方完成確認
        await activityTrackingService.trackActivity(
          req.user._id,
          "COMPLETE_TRANSACTION",
          "transaction",
          transaction._id as Types.ObjectId,
          {
            previousStatus: transaction.status,
            finalConfirmBy: req.user._id,
            sellerConfirmed: transaction.sellerConfirmed,
            buyerConfirmed: transaction.buyerConfirmed,
          },
          req
        );

        // 雙方都確認，更新交易狀態為完成
        transaction.status = "completed";

        // 更新相關商品狀態
        await Product.findByIdAndUpdate(transaction.product, {
          status: "sold",
        });

        await transaction.save();

        return res.status(200).json({
          status: "success",
          message: "交易已完成",
          data: { transaction },
        });
      } else {
        // 追蹤單方確認
        await activityTrackingService.trackActivity(
          req.user._id,
          "CONFIRM_TRANSACTION",
          "transaction",
          transaction._id as Types.ObjectId,
          {
            confirmedBy: isSeller ? "seller" : "buyer",
            sellerConfirmed: transaction.sellerConfirmed,
            buyerConfirmed: transaction.buyerConfirmed,
          },
          req
        );

        // 儲存單方確認狀態
        await transaction.save();

        return res.status(200).json({
          status: "success",
          message: "已確認交易，等待對方確認",
          data: { transaction },
        });
      }
    } catch (error) {
      next(error);
    }
  };
}

export default new TransactionController();
