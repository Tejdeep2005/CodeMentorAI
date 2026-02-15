import express from "express"
import {
  getCodingProfile,
  updateCodingProfile,
  getDailyRecommendations,
  refreshCodingStats,
  getDailyChallenges,
  solveChallengeHandler,
} from "../controllers/codingProfileController.js"
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.use(protect)

router.get("/", getCodingProfile)
router.put("/", updateCodingProfile)
router.post("/refresh", refreshCodingStats)
router.get("/recommendations", getDailyRecommendations)
router.get("/daily-challenge", getDailyChallenges)
router.post("/solve-challenge", solveChallengeHandler)

export default router
