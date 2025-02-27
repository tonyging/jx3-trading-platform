import { Router, RequestHandler } from "express";
import { authenticate } from "../middleware/auth";
import transactionController from "../controllers/transactionController";
import upload from "../middleware/upload";
const router = Router();

// 需要登入的路由
router.get("/", authenticate, transactionController.getUserTransactions);
router.get("/:id", authenticate, transactionController.getTransactionDetails);
router.post("/:id/messages", authenticate, transactionController.sendMessage);

// 修改有上傳功能的路由，使用類型斷言解決類型衝突
router.post(
  "/:id/payment-proof",
  authenticate,
  upload.single("paymentProof"),
  transactionController.uploadPaymentProof as RequestHandler
);

router.patch(
  "/:id/confirm",
  authenticate,
  transactionController.confirmTransaction
);
router.patch(
  "/:id/cancel",
  authenticate,
  transactionController.cancelTransaction
);

router.post(
  "/:id/complete",
  authenticate,
  transactionController.completeTransaction
);

export default router;
