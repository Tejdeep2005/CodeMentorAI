import express from "express"
import { getUpcomingContests } from "../controllers/contestController.js"
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/upcoming", protect, getUpcomingContests)

export default router
