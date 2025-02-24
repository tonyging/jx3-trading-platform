import { Router } from "express";
import { authenticate } from "../middleware/auth";
import ratingController from "../controllers/ratingController";

const router = Router();

// 需要登入的路由
router.post("/", authenticate, ratingController.createRating);
router.delete("/:ratingId", authenticate, ratingController.deleteRating);

// 不需要登入的路由
router.get("/user/:userId", ratingController.getUserRatings);

export default router;
