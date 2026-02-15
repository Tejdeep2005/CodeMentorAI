import express from "express"
import { getJobRecommendations } from "../controllers/jobController.js"
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.use(protect)

router.get("/recommendations", getJobRecommendations)

export default router
