import express from "express"
import { executeCode, getCodeAssistance } from "../controllers/codeEditorController.js"
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.use(protect)

router.post("/execute", executeCode)
router.post("/assist", getCodeAssistance)

export default router
