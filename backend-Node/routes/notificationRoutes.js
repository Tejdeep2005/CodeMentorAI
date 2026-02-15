import express from "express"
import {
  updateNotificationSettings,
  getNotificationSettings,
  sendDailyProgressNotification,
  sendWeeklyReportNotification,
} from "../controllers/notificationController.js"
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.use(protect)

router.get("/settings", getNotificationSettings)
router.put("/settings", updateNotificationSettings)
router.post("/send-daily", sendDailyProgressNotification)
router.post("/send-weekly", sendWeeklyReportNotification)

export default router
