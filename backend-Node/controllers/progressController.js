import asyncHandler from "express-async-handler"
import WeeklyProgress from "../models/weeklyProgressModel.js"
import CodingProfile from "../models/codingProfileModel.js"

// @desc get weekly progress for last 12 weeks
// @route /api/progress/weekly
// @method get
const getWeeklyProgress = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id
    const now = new Date()
    
    // Get last 12 weeks of data
    const weeksData = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const progress = await WeeklyProgress.findOne({
        userId,
        week: { $gte: weekStart, $lte: weekEnd },
      })
      
      weeksData.push({
        week: weekStart.toISOString().split('T')[0],
        data: progress || getDefaultWeekData(),
      })
    }

    res.status(200).json({
      weeksData,
      message: "Weekly progress retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching weekly progress:", error.message)
    res.status(500).json({ message: "Error fetching weekly progress" })
  }
})

// @desc update weekly progress
// @route /api/progress/update
// @method post
const updateWeeklyProgress = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id
    const { platform, problemsSolved, contestsParticipated, rating } = req.body

    if (!platform) {
      res.status(400)
      throw new Error("Platform is required")
    }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    let progress = await WeeklyProgress.findOne({
      userId,
      week: weekStart,
    })

    if (!progress) {
      progress = new WeeklyProgress({
        userId,
        week: weekStart,
        platforms: {
          leetcode: { problemsSolved: 0, contestsParticipated: 0, rating: 0 },
          codeforces: { problemsSolved: 0, contestsParticipated: 0, rating: 0 },
          codechef: { problemsSolved: 0, contestsParticipated: 0, rating: 0 },
          hackerrank: { problemsSolved: 0, contestsParticipated: 0, rating: 0 },
        },
      })
    }

    // Update platform data
    const platformKey = platform.toLowerCase()
    if (progress.platforms[platformKey]) {
      if (problemsSolved !== undefined) {
        progress.platforms[platformKey].problemsSolved = problemsSolved
      }
      if (contestsParticipated !== undefined) {
        progress.platforms[platformKey].contestsParticipated = contestsParticipated
      }
      if (rating !== undefined) {
        progress.platforms[platformKey].rating = rating
      }
    }

    // Calculate totals
    progress.totalProblemsSolved = Object.values(progress.platforms).reduce(
      (sum, p) => sum + p.problemsSolved,
      0
    )
    progress.totalContestsParticipated = Object.values(progress.platforms).reduce(
      (sum, p) => sum + p.contestsParticipated,
      0
    )

    await progress.save()

    res.status(200).json({
      message: "Weekly progress updated successfully",
      progress,
    })
  } catch (error) {
    console.error("Error updating weekly progress:", error.message)
    res.status(500).json({ message: "Error updating weekly progress" })
  }
})

// @desc get current week stats
// @route /api/progress/current-week
// @method get
const getCurrentWeekStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    let progress = await WeeklyProgress.findOne({
      userId,
      week: weekStart,
    })

    if (!progress) {
      progress = getDefaultWeekData()
    }

    res.status(200).json(progress)
  } catch (error) {
    console.error("Error fetching current week stats:", error.message)
    res.status(500).json({ message: "Error fetching current week stats" })
  }
})

// Helper function to get default week data
const getDefaultWeekData = () => {
  return {
    platforms: {
      leetcode: { problemsSolved: 0, contestsParticipated: 0, rating: 0 },
      codeforces: { problemsSolved: 0, contestsParticipated: 0, rating: 0 },
      codechef: { problemsSolved: 0, contestsParticipated: 0, rating: 0 },
      hackerrank: { problemsSolved: 0, contestsParticipated: 0, rating: 0 },
    },
    totalProblemsSolved: 0,
    totalContestsParticipated: 0,
  }
}

export { getWeeklyProgress, updateWeeklyProgress, getCurrentWeekStats }
