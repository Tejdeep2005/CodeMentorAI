import express from "express"
import {
  getWeeklyProgress,
  updateWeeklyProgress,
  getCurrentWeekStats,
} from "../controllers/progressController.js"
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.use(protect)

router.get("/weekly", getWeeklyProgress)
router.get("/current-week", getCurrentWeekStats)
router.post("/update", updateWeeklyProgress)

export default router
