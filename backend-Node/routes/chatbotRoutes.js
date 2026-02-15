import express from "express"
import {
  sendMessage,
  getChatHistory,
  getConversations,
  clearConversation,
  getQuickTip,
  startNewConversation,
} from "../controllers/chatbotController.js"
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router()

// All routes require authentication
router.use(protect)

// Chat endpoints
router.post("/message", sendMessage)
router.get("/history/:conversationId", getChatHistory)
router.get("/conversations", getConversations)
router.delete("/clear/:conversationId", clearConversation)
router.post("/tip", getQuickTip)
router.post("/new", startNewConversation)

export default router
