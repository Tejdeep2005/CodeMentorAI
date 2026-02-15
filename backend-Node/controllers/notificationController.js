import asyncHandler from "express-async-handler"
import User from "../models/userModel.js"
import WeeklyProgress from "../models/weeklyProgressModel.js"
import { sendDailyProgressEmail, sendWeeklyReportEmail, sendContestReminderEmail } from "../services/emailService.js"

// @desc update email notification settings
// @route /api/notifications/settings
// @method put
const updateNotificationSettings = asyncHandler(async (req, res) => {
  try {
    const { dailyProgress, weeklyReport, contestReminders } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      res.status(404)
      throw new Error("User not found")
    }

    if (dailyProgress !== undefined) {
      user.emailNotifications.dailyProgress = dailyProgress
    }
    if (weeklyReport !== undefined) {
      user.emailNotifications.weeklyReport = weeklyReport
    }
    if (contestReminders !== undefined) {
      user.emailNotifications.contestReminders = contestReminders
    }

    await user.save()

    res.status(200).json({
      message: "Notification settings updated",
      settings: user.emailNotifications,
    })
  } catch (error) {
    console.error("Error updating notification settings:", error.message)
    res.status(500).json({ message: "Error updating notification settings" })
  }
})

// @desc get email notification settings
// @route /api/notifications/settings
// @method get
const getNotificationSettings = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      res.status(404)
      throw new Error("User not found")
    }

    res.status(200).json(user.emailNotifications)
  } catch (error) {
    console.error("Error fetching notification settings:", error.message)
    res.status(500).json({ message: "Error fetching notification settings" })
  }
})

// @desc send daily progress email (called by cron job)
// @route /api/notifications/send-daily
// @method post
const sendDailyProgressNotification = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({ "emailNotifications.enabled": true, "emailNotifications.dailyProgress": true })

    let sentCount = 0

    for (const user of users) {
      // Get today's progress
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
      sentCount++
    }

    res.status(200).json({
      message: `Daily progress emails sent to ${sentCount} users`,
      count: sentCount,
    })
  } catch (error) {
    console.error("Error sending daily notifications:", error.message)
    res.status(500).json({ message: "Error sending daily notifications" })
  }
})

// @desc send weekly report email (called by cron job)
// @route /api/notifications/send-weekly
// @method post
const sendWeeklyReportNotification = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({ "emailNotifications.enabled": true, "emailNotifications.weeklyReport": true })

    let sentCount = 0

    for (const user of users) {
      // Get this week's progress
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
      sentCount++
    }

    res.status(200).json({
      message: `Weekly report emails sent to ${sentCount} users`,
      count: sentCount,
    })
  } catch (error) {
    console.error("Error sending weekly notifications:", error.message)
    res.status(500).json({ message: "Error sending weekly notifications" })
  }
})

export {
  updateNotificationSettings,
  getNotificationSettings,
  sendDailyProgressNotification,
  sendWeeklyReportNotification,
}
