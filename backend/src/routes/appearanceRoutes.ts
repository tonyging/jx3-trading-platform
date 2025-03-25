import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { checkBanStatus, isAdmin } from "../middleware/roleCheck";
import appearanceController from "../controllers/appearanceController";

const router = Router();

// 需要登入的路由
router.use(authenticate);
router.use(checkBanStatus);

// 提交新外觀
router.post("/submit", appearanceController.submitAppearance);

// 獲取待審核的外觀列表
router.get("/pending", appearanceController.getPendingSubmissions);

// 審核外觀
router.post("/review/:submissionId", appearanceController.reviewSubmission);

// 獲取用戶提交的外觀列表
router.get("/my-submissions", appearanceController.getUserSubmissions);

// 刪除提交的外觀
router.delete(
  "/submission/:submissionId",
  appearanceController.deleteSubmission
);

// 更新外觀圖片 URL (僅限管理員)
router.patch(
  "/:appearanceId",
  isAdmin,
  appearanceController.updateAppearanceImage
);

// 公開路由(不需要登入)
router.get(
  "/public",
  (req, res, next) => {
    authenticate(req, res, () => {
      next();
    });
  },
  appearanceController.getAllAppearances
);

router.get(
  "/public/search",
  (req, res, next) => {
    authenticate(req, res, () => {
      next();
    });
  },
  appearanceController.searchAppearances
);

router.get(
  "/public/:id",
  (req, res, next) => {
    authenticate(req, res, () => {
      next();
    });
  },
  appearanceController.getAppearance
);

export default router;
