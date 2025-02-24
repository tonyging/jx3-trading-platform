import { Router } from "express";
import userController from "../controllers/userController";
import { isAdmin, checkBanStatus } from "../middleware/roleCheck";
import { authenticate } from "../middleware/auth";

// 建立一個新的路由器實例
const router = Router();

// Google 登入相關路由
router.get("/auth/google", userController.getGoogleAuthUrl);
router.post("/auth/google/login", userController.handleGoogleLogin);
router.get("/auth/google/callback", userController.handleGoogleCallback);

// 註冊相關路由
router.post("/send-verification", userController.sendVerificationCode); // 發送驗證碼
router.post("/verify-code", userController.verifyCode); // 驗證碼確認
router.post("/complete-registration", userController.completeRegistration); // 完成註冊

// 忘記密碼相關路由
router.post("/forgot-password/send-code", userController.sendPasswordResetCode);
router.post(
  "/forgot-password/verify-code",
  userController.verifyPasswordResetCode
);
router.post("/forgot-password/reset", userController.resetPasswordWithCode);

// 登入路由
router.post("/login", userController.login);

// 需要登入的路由
router.use(authenticate); // 驗證登入狀態
router.use(checkBanStatus); // 檢查是否被停權

// 受保護的路由 - 需要驗證
router.get("/profile", authenticate, userController.getProfile);
router.patch("/profile", authenticate, userController.updateProfile);
router.patch("/password", authenticate, userController.updatePassword);
router.get("/login-history", authenticate, userController.getLoginHistory);
router.delete("/account", authenticate, userController.deleteAccount);
// 手機驗證功能
router.post("/verify-phone", authenticate, userController.verifyPhoneNumber);
router.get(
  "/phone-verification-status",
  authenticate,
  userController.checkPhoneVerification
);

// 管理員路由
router.patch(
  "/role/:userId",
  authenticate,
  isAdmin,
  userController.updateUserRole
);

export default router;
