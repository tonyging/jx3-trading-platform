// routes/appearanceTradeRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { checkBanStatus } from "../middleware/roleCheck";
import appearanceTradeController from "../controllers/appearanceTradeController";

const router = Router();

// 公開路由(不需要登入)
router.get(
  "/",
  (req, res, next) => {
    authenticate(req, res, () => {
      next();
    });
  },
  appearanceTradeController.getAppearanceTrades
);

router.get(
  "/:id",
  (req, res, next) => {
    authenticate(req, res, () => {
      next();
    });
  },
  appearanceTradeController.getAppearanceTradeById
);

// 需要登入的路由
router.use(authenticate);
router.use(checkBanStatus);

// 賣家操作
router.post("/", appearanceTradeController.createAppearanceTrade);
router.patch("/:id", appearanceTradeController.updateTrade);
router.delete("/:id", appearanceTradeController.deleteTrade);
router.post(
  "/:id/seller-confirm",
  appearanceTradeController.sellerConfirmTrade
);

// 買家操作
router.post("/:id/reserve", appearanceTradeController.reserveAppearanceTrade);
router.post("/:id/payment-proof", appearanceTradeController.uploadPaymentProof);
router.post("/:id/buyer-confirm", appearanceTradeController.buyerConfirmTrade);

// 共用操作
router.post("/:id/messages", appearanceTradeController.sendMessage);
router.post("/:id/cancel", appearanceTradeController.cancelTrade);

export default router;
