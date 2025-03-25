// middleware/uploadImage.ts
import multer from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";

// 確保上傳目錄存在
const uploadDir = path.join(process.cwd(), "uploads/appearances");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置儲存方式
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `appearance-${uniqueSuffix}${ext}`);
  },
});

// 文件過濾器 - 只允許圖片類型
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("不支持的文件類型，只允許上傳 JPG、PNG、GIF 或 WebP 圖片"));
  }
};

// 創建 multer 實例
const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制文件大小為 5MB
  },
});

export default uploadImage;
