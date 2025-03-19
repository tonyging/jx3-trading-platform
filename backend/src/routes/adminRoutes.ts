// routes/adminRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { isAdmin } from "../middleware/roleCheck";
import adminController from "../controllers/adminController";

const router = Router();

// 所有管理員路由都需要驗證和管理員權限
router.use(authenticate);
router.use(isAdmin);

// 儀表板統計數據
router.get("/stats", adminController.getStats);

// 用戶管理
router.get("/users", adminController.getUsers);
router.get("/users/search", adminController.searchUsers);
router.get("/users/:userId", adminController.getUserDetail);

// 商品管理
router.get("/products", adminController.getProducts);
router.get("/products/search", adminController.searchProducts);

// 交易管理
router.get("/transactions", adminController.getTransactions);
router.get("/transactions/search", adminController.searchTransactions);

// 系統日誌
router.get("/logs", adminController.getLogs);

export default router;
