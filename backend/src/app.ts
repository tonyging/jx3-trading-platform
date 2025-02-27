import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDB } from "./config/database";
import userRoutes from "./routes/userRoutes";
import ratingRoutes from "./routes/ratingRoutes";
import productRoutes from "./routes/productRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import activityRoutes from "./routes/activityRoutes";

class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.connectToDatabase();
    this.middlewares();
    this.routes();
  }

  private async connectToDatabase(): Promise<void> {
    await connectDB();
  }

  private middlewares(): void {
    // CORS 配置
    const corsOptions = {
      origin: [
        "http://localhost:5173", // Vite 預設開發伺服器
        "http://127.0.0.1:5173",
        "https://jx3-trading-platform.onrender.com",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization", // 如果使用 JWT 驗證
        "Accept",
      ],
      credentials: true, // 允許攜帶 cookie
      optionsSuccessStatus: 200,
    };

    // 應用 CORS 中間件
    this.app.use(cors(corsOptions));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log("原始請求數據:", req.query);
      console.log("收到前端請求:", {
        time: new Date().toISOString(),
        query: req.query,
      });
      next();
    });
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error("伺服器錯誤詳細資訊:", {
          message: err.message,
          stack: err.stack,
          requestBody: req.body,
        });

        res.status(500).json({
          status: "error",
          message: "伺服器發生內部錯誤",
          // 開發環境才顯示詳細錯誤
          errorDetails:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    );
  }

  private routes(): void {
    // 健康檢查端點
    this.app.get("/healthz", (req: Request, res: Response) => {
      res.status(200).send("OK");
    });

    this.app.use("/api/users", userRoutes);
    this.app.use("/api/ratings", ratingRoutes);
    this.app.use("/api/products", productRoutes);
    this.app.use("/api/transactions", transactionRoutes);
    this.app.use("/api/activities", activityRoutes);
  }
}

export default new App().app;
