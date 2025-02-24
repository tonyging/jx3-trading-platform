import mongoose from "mongoose";
import dotenv from "dotenv";

// 載入環境變數
dotenv.config();

// 資料庫連接函數
export const connectDB = async (): Promise<void> => {
  try {
    // mongoose.connect 會返回一個 Promise
    await mongoose.connect(process.env.MONGODB_URI as string);

    console.log("成功連接到 MongoDB 資料庫");

    // 監聽資料庫連接事件
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB 連接錯誤:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB 連接已斷開");
    });
  } catch (error) {
    console.error("無法連接到 MongoDB:", error);
    process.exit(1); // 如果資料庫連接失敗，結束程式
  }
};
