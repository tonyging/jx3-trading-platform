// routes/activityRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { isAdmin } from "../middleware/roleCheck";
import activityController from "../controllers/activityController";

const router = Router();

// 需要管理員權限的路由
router.get("/all", authenticate, isAdmin, activityController.getAllActivities);

// 需要登入的路由
router.get("/", authenticate, activityController.getUserActivities);
router.get(
  "/statistics",
  authenticate,
  activityController.getActivityStatistics
);

export default router;
