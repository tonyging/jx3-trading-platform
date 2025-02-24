// scripts/createAdmin.ts
import mongoose from "mongoose";
import User from "../models/userModel";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function createAdminUser() {
  try {
    // 連接資料庫
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("已連接到資料庫");

    const plainPassword = "@Rgin0422";

    // 使用 bcrypt 進行密碼加密
    const salt = await bcrypt.genSalt(12); // 產生加密用的 salt
    const hashedPassword = await bcrypt.hash(plainPassword, salt); // 進行密碼加密

    // 創建或更新管理員帳號
    const adminData = {
      email: "tony10130357@gmail.com", // 設定管理員郵箱
      password: hashedPassword, // 設定安全的密碼
      name: "系統管理員",
      role: "admin",
      loginAttempts: 0,
      lockUntil: null,
      averageRating: 0,
      totalRatings: 0,
      contactInfo: {},
    };

    // 更新或創建管理員帳號
    const admin = await User.findOneAndUpdate(
      { email: adminData.email }, // 查詢條件
      adminData, // 更新的數據
      {
        upsert: true, // 如果不存在就創建
        new: true, // 返回更新後的文檔
        runValidators: true, // 運行驗證
      }
    );

    console.log("管理員帳號設定成功:", admin);
    console.log({
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
    // 特別顯示登入資訊
    console.log("\n請使用以下資訊登入:");
    console.log("電子郵件:", adminData.email);
    console.log("密碼:", plainPassword);
  } catch (error) {
    console.error("設定管理員失敗:", error);
  } finally {
    // 關閉資料庫連接
    await mongoose.disconnect();
    console.log("資料庫連接已關閉");
  }
}

// 執行腳本
createAdminUser();
