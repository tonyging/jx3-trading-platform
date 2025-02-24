import multer from "multer";
import path from "path";
import fs from "fs";

// 確保上傳目錄存在
const uploadDir = path.join(process.cwd(), "uploads/payment-proofs");
fs.mkdirSync(uploadDir, { recursive: true });

// 配置存儲
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `payment-proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 文件過濾器
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // 只允許圖片
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true);
  } else {
    cb(new Error("不支持的檔案類型，僅支持 jpg, png 和 gif"));
  }
};

// 配置 multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 檔案大小限制
  },
});

export default upload;
