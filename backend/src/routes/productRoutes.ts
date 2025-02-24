import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { trackProductView } from "../middleware/activityTracking";
import productController from "../controllers/productController";

const router = Router();

// 需要登入的路由
router.post("/", authenticate, productController.createProduct);
router.post("/:id/reserve", authenticate, productController.reserveProduct); // 買家保留商品
router.patch("/:id", authenticate, productController.updateProduct); // 賣家更新商品
router.delete("/:id", authenticate, productController.deleteProduct); // 刪除商品

// 公開路由
router.get("/:id", trackProductView, productController.getProducts);
router.get("/", productController.getProducts);

export default router;
