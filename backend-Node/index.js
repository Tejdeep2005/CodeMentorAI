import express from "express"
import dotenv from "dotenv"
import userRoutes from "./routes/userRoutes.js"
import codingProfileRoutes from "./routes/codingProfileRoutes.js"
import interviewRoutes from "./routes/interviewRoutes.js"
import jobRoutes from "./routes/jobRoutes.js"
import contestRoutes from "./routes/contestRoutes.js"
import progressRoutes from "./routes/progressRoutes.js"
import codeEditorRoutes from "./routes/codeEditorRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import chatbotRoutes from "./routes/chatbotRoutes.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import multer from "multer"
import { analyzeResume } from "./controllers/resumeController.js"
import { protect } from "./middlewares/authMiddleware.js"
import { startContestUpdateJob } from "./controllers/contestController.js"
import cron from "node-cron"
import User from "./models/userModel.js"
import WeeklyProgress from "./models/weeklyProgressModel.js"
import { sendDailyProgressEmail, sendWeeklyReportEmail } from "./services/emailService.js"

dotenv.config()
const PORT = process.env.PORT || 3000
import axios from "axios"
import connectDB from "./config/db.js"

connectDB()

const app = express()

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json())

app.use(cookieParser())

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" })

app.use("/api/users", userRoutes)
app.use("/api/coding-profile", codingProfileRoutes)
app.use("/api/interview", interviewRoutes)
app.use("/api/jobs", jobRoutes)
app.use("/api/contests", contestRoutes)
app.use("/api/progress", progressRoutes)
app.use("/api/code-editor", codeEditorRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/chatbot", chatbotRoutes)

// Resume analysis endpoint
app.post("/analyze-resume/", protect, upload.single("file"), analyzeResume)

// Start background contest update job
startContestUpdateJob()

// Cron job for daily progress emails (runs at 9 AM every day)
cron.schedule("0 9 * * *", async () => {
  console.log("Running daily progress email job...")
  try {
    const users = await User.find({ "emailNotifications.enabled": true, "emailNotifications.dailyProgress": true })

    for (const user of users) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - today.getDay())

      const progress = await WeeklyProgress.findOne({
        userId: user._id,
        week: weekStart,
      })

      const progressData = {
        problemsSolved: progress?.totalProblemsSolved || 0,
        contestsJoined: progress?.totalContestsParticipated || 0,
        leetcode: progress?.platforms?.leetcode?.problemsSolved || 0,
        codeforces: progress?.platforms?.codeforces?.problemsSolved || 0,
        codechef: progress?.platforms?.codechef?.problemsSolved || 0,
        hackerrank: progress?.platforms?.hackerrank?.problemsSolved || 0,
      }

      await sendDailyProgressEmail(user, progressData)
    }

    console.log("Daily progress emails sent successfully")
  } catch (error) {
    console.error("Error in daily email cron job:", error.message)
  }
})

// Cron job for weekly reports (runs every Monday at 9 AM)
cron.schedule("0 9 * * 1", async () => {
  console.log("Running weekly report email job...")
  try {
    const users = await User.find({ "emailNotifications.enabled": true, "emailNotifications.weeklyReport": true })

    for (const user of users) {
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - today.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const progress = await WeeklyProgress.findOne({
        userId: user._id,
        week: weekStart,
      })

      const weeklyData = {
        totalProblems: progress?.totalProblemsSolved || 0,
        totalContests: progress?.totalContestsParticipated || 0,
        leetcode: progress?.platforms?.leetcode?.problemsSolved || 0,
        codeforces: progress?.platforms?.codeforces?.problemsSolved || 0,
        codechef: progress?.platforms?.codechef?.problemsSolved || 0,
        hackerrank: progress?.platforms?.hackerrank?.problemsSolved || 0,
      }

      await sendWeeklyReportEmail(user, weeklyData)
    }

    console.log("Weekly report emails sent successfully")
  } catch (error) {
    console.error("Error in weekly email cron job:", error.message)
  }
})

app.listen(PORT, () => {
  console.log("Server listening on port: " + PORT)
})
