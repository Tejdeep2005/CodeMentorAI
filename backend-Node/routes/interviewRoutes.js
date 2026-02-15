import express from "express"
import {
  getInterviewQuestions,
  evaluateResponse,
  saveInterviewResult,
  getAvailableRoles,
} from "../controllers/interviewController.js"
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.use(protect)

router.get("/roles", getAvailableRoles)
router.get("/questions", getInterviewQuestions)
router.post("/evaluate", evaluateResponse)
router.post("/save-result", saveInterviewResult)

export default router
