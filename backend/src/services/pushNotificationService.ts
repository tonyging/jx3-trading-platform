// services/pushNotificationService.ts
import webpush from "web-push";
import PushSubscription from "../models/pushSubscriptionModel";
import { Types } from "mongoose";

// 設置 VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY as string;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY as string;

webpush.setVapidDetails(
  "mailto:" + (process.env.VAPID_CONTACT_EMAIL || "example@example.com"),
  vapidPublicKey,
  vapidPrivateKey
);

class PushNotificationService {
  // 保存或更新推播訂閱
  async saveSubscription(userId: Types.ObjectId, subscriptionString: string) {
    try {
      // 解析訂閱字串確保格式正確
      const subscriptionObj = JSON.parse(subscriptionString);

      // 使用 upsert 操作: 如果找不到就創建，找到就更新
      await PushSubscription.findOneAndUpdate(
        { userId },
        { subscription: subscriptionString },
        { upsert: true, new: true }
      );

      return true;
    } catch (error) {
      console.error("保存推播訂閱失敗:", error);
      return false;
    }
  }

  // 發送推播通知
  async sendNotification(
    userId: Types.ObjectId,
    title: string,
    content: string,
    url: string = "/"
  ) {
    try {
      // 查找用戶的推播訂閱
      const subscriptionRecord = await PushSubscription.findOne({ userId });

      if (!subscriptionRecord) {
        console.log(`用戶 ${userId} 沒有推播訂閱記錄`);
        return false;
      }

      // 解析訂閱字串
      const subscription = JSON.parse(subscriptionRecord.subscription);

      // 準備推播內容
      const payload = JSON.stringify({
        title,
        content,
        url,
        timestamp: new Date().getTime(),
      });

      // 發送推播
      await webpush.sendNotification(subscription, payload);
      return true;
    } catch (error) {
      // 處理錯誤，包括訂閱過期的情況
      console.error("發送推播通知失敗:", error);

      // 如果訂閱過期或無效，刪除它
      if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        (error.statusCode === 404 || error.statusCode === 410)
      ) {
        await PushSubscription.deleteOne({ userId });
      }

      return false;
    }
  }

  // 發送交易相關通知
  async sendTradeNotification(
    userId: Types.ObjectId,
    type: string,
    productName: string,
    transactionId: Types.ObjectId,
    buyerName?: string
  ) {
    let title = "";
    let content = "";
    let url = `/transactions/${transactionId}`;

    switch (type) {
      case "trade_reserved":
        title = "您的商品已被預訂";
        content = `您的商品「${productName}」已被買家${
          buyerName ? " " + buyerName : ""
        }預訂，請及時查看交易詳情。`;
        break;
      case "trade_completed":
        title = "交易已完成";
        content = `您的商品「${productName}」交易已完成。`;
        break;
      case "trade_cancelled":
        title = "交易已取消";
        content = `您的商品「${productName}」交易已被取消。`;
        break;
      case "payment_uploaded":
        title = "買家已上傳付款證明";
        content = `您的商品「${productName}」買家已上傳付款證明，請及時確認。`;
        break;
    }

    return await this.sendNotification(userId, title, content, url);
  }

  // 檢查用戶是否已訂閱推播
  async isUserSubscribed(userId: Types.ObjectId) {
    const subscription = await PushSubscription.findOne({ userId });
    return !!subscription;
  }

  // 刪除用戶的推播訂閱
  async deleteSubscription(userId: Types.ObjectId) {
    try {
      await PushSubscription.deleteOne({ userId });
      return true;
    } catch (error) {
      console.error("刪除推播訂閱失敗:", error);
      return false;
    }
  }
}

export default new PushNotificationService();
