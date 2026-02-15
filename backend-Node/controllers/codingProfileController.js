import asyncHandler from "express-async-handler"
import CodingProfile from "../models/codingProfileModel.js"
import { fetchAllStats } from "../services/codingPlatformService.js"

// @desc get or create coding profile
// route /api/coding-profile
// @method get
const getCodingProfile = asyncHandler(async (req, res) => {
  let profile = await CodingProfile.findOne({ userId: req.user._id })

  if (!profile) {
    profile = await CodingProfile.create({
      userId: req.user._id,
    })
  }

  res.status(200).json(profile)
})

// @desc update coding profile IDs and fetch stats
// route /api/coding-profile
// @method put
const updateCodingProfile = asyncHandler(async (req, res) => {
  const { leetcodeId, hackerrankId, hackerrankSolved, codechefId, geeksforgeeksId, geeksforgeeksSolved } = req.body

  let profile = await CodingProfile.findOne({ userId: req.user._id })

  if (!profile) {
    profile = await CodingProfile.create({
      userId: req.user._id,
      leetcodeId: leetcodeId || "",
      hackerrankId: hackerrankId || "",
      codechefId: codechefId || "",
      geeksforgeeksId: geeksforgeeksId || "",
    })
  } else {
    if (leetcodeId !== undefined) profile.leetcodeId = leetcodeId
    if (hackerrankId !== undefined) profile.hackerrankId = hackerrankId
    if (codechefId !== undefined) profile.codechefId = codechefId
    if (geeksforgeeksId !== undefined) profile.geeksforgeeksId = geeksforgeeksId
  }

  // Fetch real stats from platforms
  const stats = await fetchAllStats(
    profile.leetcodeId,
    profile.hackerrankId,
    profile.codechefId,
    profile.geeksforgeeksId
  )

  if (stats.leetcodeStats) {
    profile.leetcodeStats = stats.leetcodeStats
  }
  
  // Handle HackerRank stats - use manual entry if provided
  if (stats.hackerrankStats) {
    profile.hackerrankStats = stats.hackerrankStats
  }
  
  // If manual HackerRank solved count is provided, use it
  if (hackerrankSolved !== undefined && hackerrankSolved > 0) {
    profile.hackerrankStats = {
      solved: hackerrankSolved,
      lastUpdated: new Date(),
    }
  }
  
  if (stats.codechefStats) {
    profile.codechefStats = stats.codechefStats
  }

  // Handle GeeksforGeeks stats - use manual entry if provided
  if (stats.geeksforgeeksStats) {
    profile.geeksforgeeksStats = stats.geeksforgeeksStats
  }
  
  // If manual GFG solved count is provided, use it
  if (geeksforgeeksSolved !== undefined && geeksforgeeksSolved > 0) {
    profile.geeksforgeeksStats = {
      solved: geeksforgeeksSolved,
      score: stats.geeksforgeeksStats?.score || 0,
      streak: stats.geeksforgeeksStats?.streak || 0,
      lastUpdated: new Date(),
    }
  }

  await profile.save()

  res.status(200).json(profile)
})

// @desc refresh coding stats from platforms
// route /api/coding-profile/refresh
// @method post
const refreshCodingStats = asyncHandler(async (req, res) => {
  const profile = await CodingProfile.findOne({ userId: req.user._id })

  if (!profile) {
    res.status(404)
    throw new Error("Coding profile not found")
  }

  // Fetch fresh stats from platforms
  const stats = await fetchAllStats(
    profile.leetcodeId,
    profile.hackerrankId,
    profile.codechefId,
    profile.geeksforgeeksId
  )

  if (stats.leetcodeStats) {
    profile.leetcodeStats = stats.leetcodeStats
  }
  if (stats.hackerrankStats) {
    profile.hackerrankStats = stats.hackerrankStats
  }
  if (stats.codechefStats) {
    profile.codechefStats = stats.codechefStats
  }
  if (stats.geeksforgeeksStats) {
    profile.geeksforgeeksStats = stats.geeksforgeeksStats
  }

  await profile.save()

  res.status(200).json({
    message: "Stats refreshed successfully",
    profile,
  })
})

// @desc get daily recommendations based on coding stats
// route /api/coding-profile/recommendations
// @method get
const getDailyRecommendations = asyncHandler(async (req, res) => {
  const profile = await CodingProfile.findOne({ userId: req.user._id })

  if (!profile) {
    res.status(404)
    throw new Error("Coding profile not found")
  }

  const recommendations = []

  // LeetCode recommendations
  if (profile.leetcodeId) {
    const totalSolved = profile.leetcodeStats?.solved || 0
    if (totalSolved < 50) {
      recommendations.push({
        platform: "LeetCode",
        priority: "high",
        message: `You've solved ${totalSolved} problems. Target: 50 problems. Keep practicing!`,
        action: "Solve 2-3 easy problems today",
      })
    } else if (totalSolved < 150) {
      recommendations.push({
        platform: "LeetCode",
        priority: "medium",
        message: `Great progress! ${totalSolved} problems solved. Focus on medium problems.`,
        action: "Solve 1-2 medium problems today",
      })
    } else {
      recommendations.push({
        platform: "LeetCode",
        priority: "low",
        message: `Excellent! ${totalSolved} problems solved. Challenge yourself with hard problems.`,
        action: "Solve 1 hard problem today",
      })
    }
  } else {
    recommendations.push({
      platform: "LeetCode",
      priority: "high",
      message: "Connect your LeetCode account to track progress",
      action: "Add your LeetCode ID",
    })
  }

  // HackerRank recommendations
  if (profile.hackerrankId) {
    const solved = profile.hackerrankStats?.solved || 0
    recommendations.push({
      platform: "HackerRank",
      priority: "medium",
      message: `You've solved ${solved} HackerRank problems.`,
      action: "Complete 1 HackerRank challenge today",
    })
  } else {
    recommendations.push({
      platform: "HackerRank",
      priority: "medium",
      message: "Connect your HackerRank account to track progress",
      action: "Add your HackerRank ID",
    })
  }

  // CodeChef recommendations
  if (profile.codechefId) {
    const rating = profile.codechefStats?.rating || 0
    if (rating < 1200) {
      recommendations.push({
        platform: "CodeChef",
        priority: "high",
        message: `Current rating: ${rating}. Target: 1200+`,
        action: "Participate in CodeChef contests",
      })
    } else {
      recommendations.push({
        platform: "CodeChef",
        priority: "low",
        message: `Great rating: ${rating}! Keep competing.`,
        action: "Participate in CodeChef contests",
      })
    }
  } else {
    recommendations.push({
      platform: "CodeChef",
      priority: "medium",
      message: "Connect your CodeChef account to track progress",
      action: "Add your CodeChef ID",
    })
  }

  // GeeksforGeeks recommendations
  if (profile.geeksforgeeksId) {
    const solved = profile.geeksforgeeksStats?.solved || 0
    const score = profile.geeksforgeeksStats?.score || 0
    if (solved < 100) {
      recommendations.push({
        platform: "GeeksforGeeks",
        priority: "high",
        message: `You've solved ${solved} problems. Score: ${score}. Target: 100+ problems!`,
        action: "Solve 3-5 GFG problems today",
      })
    } else {
      recommendations.push({
        platform: "GeeksforGeeks",
        priority: "medium",
        message: `Great! ${solved} problems solved. Score: ${score}. Keep going!`,
        action: "Solve 2-3 GFG problems today",
      })
    }
  } else {
    recommendations.push({
      platform: "GeeksforGeeks",
      priority: "medium",
      message: "Connect your GeeksforGeeks account to track progress",
      action: "Add your GeeksforGeeks ID",
    })
  }

  res.status(200).json({
    profile,
    recommendations,
  })
})

// @desc get daily coding challenges
// route /api/coding-profile/daily-challenge
// @method get
const getDailyChallenges = asyncHandler(async (req, res) => {
  const profile = await CodingProfile.findOne({ userId: req.user._id })

  if (!profile) {
    res.status(404)
    throw new Error("Coding profile not found")
  }

  // All available challenges
  const allChallenges = [
    {
      id: 1,
      title: "Two Sum",
      difficulty: "Easy",
      description: "Find two numbers that add up to a target",
      link: "https://leetcode.com/problems/two-sum/",
      topics: ["Array", "Hash Table"],
    },
    {
      id: 2,
      title: "Reverse String",
      difficulty: "Easy",
      description: "Reverse a string in-place",
      link: "https://leetcode.com/problems/reverse-string/",
      topics: ["String", "Two Pointers"],
    },
    {
      id: 3,
      title: "Merge Sorted Array",
      difficulty: "Easy",
      description: "Merge two sorted arrays",
      link: "https://leetcode.com/problems/merge-sorted-array/",
      topics: ["Array", "Two Pointers"],
    },
    {
      id: 4,
      title: "Binary Search",
      difficulty: "Medium",
      description: "Implement binary search algorithm",
      link: "https://leetcode.com/problems/binary-search/",
      topics: ["Array", "Binary Search"],
    },
    {
      id: 5,
      title: "Valid Parentheses",
      difficulty: "Easy",
      description: "Check if parentheses are valid",
      link: "https://leetcode.com/problems/valid-parentheses/",
      topics: ["String", "Stack"],
    },
    {
      id: 6,
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      description: "Find longest substring without repeating characters",
      link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      topics: ["String", "Sliding Window"],
    },
    {
      id: 7,
      title: "Palindrome Number",
      difficulty: "Easy",
      description: "Determine if an integer is a palindrome",
      link: "https://leetcode.com/problems/palindrome-number/",
      topics: ["Math"],
    },
    {
      id: 8,
      title: "Roman to Integer",
      difficulty: "Easy",
      description: "Convert Roman numerals to integers",
      link: "https://leetcode.com/problems/roman-to-integer/",
      topics: ["String", "Math"],
    },
    {
      id: 9,
      title: "Container With Most Water",
      difficulty: "Medium",
      description: "Find two lines that form a container with most water",
      link: "https://leetcode.com/problems/container-with-most-water/",
      topics: ["Array", "Two Pointers"],
    },
    {
      id: 10,
      title: "3Sum",
      difficulty: "Medium",
      description: "Find all unique triplets that sum to zero",
      link: "https://leetcode.com/problems/3sum/",
      topics: ["Array", "Two Pointers"],
    },
  ]

  // Check if we need to reset challenges (daily refresh)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let lastResetDate = profile.dailyChallenges?.lastResetDate
  if (lastResetDate) {
    const lastReset = new Date(lastResetDate)
    lastReset.setHours(0, 0, 0, 0)
    
    // If it's a new day, reset solved challenges
    if (today > lastReset) {
      profile.solvedChallenges = []
      profile.dailyChallenges = { lastResetDate: new Date() }
      await profile.save()
    }
  } else {
    // First time, set the reset date
    profile.dailyChallenges = { lastResetDate: new Date() }
    await profile.save()
  }

  // Get solved challenge IDs
  const solvedIds = profile.solvedChallenges.map((c) => c.challengeId)

  // Filter unsolved challenges
  const unsolvedChallenges = allChallenges.filter((c) => !solvedIds.includes(c.id))

  // If all challenges are solved, reset and show all again
  let challengesToShow = unsolvedChallenges
  if (unsolvedChallenges.length === 0) {
    // Reset solved challenges and show all
    profile.solvedChallenges = []
    await profile.save()
    challengesToShow = allChallenges
  }

  // Show ALL unsolved challenges (not just 4)
  const displayChallenges = challengesToShow

  // Get real LeetCode streak from stored stats
  const leetcodeStreak = profile.leetcodeStats?.streak || 0
  
  // Get real LeetCode problems solved count
  const leetcodeSolved = profile.leetcodeStats?.solved || 0

  res.status(200).json({
    challenges: displayChallenges,
    solvedCount: solvedIds.length,
    totalChallenges: allChallenges.length,
    streak: leetcodeStreak,
    leetcodeSolved: leetcodeSolved,
    lastUpdated: new Date(),
  })
})

// @desc mark challenge as solved
// route /api/coding-profile/solve-challenge
// @method post
const solveChallengeHandler = asyncHandler(async (req, res) => {
  const { challengeId } = req.body

  if (!challengeId) {
    res.status(400)
    throw new Error("Challenge ID is required")
  }

  const profile = await CodingProfile.findOne({ userId: req.user._id })

  if (!profile) {
    res.status(404)
    throw new Error("Coding profile not found")
  }

  // Check if already solved
  const alreadySolved = profile.solvedChallenges.some((c) => c.challengeId === challengeId)

  if (alreadySolved) {
    res.status(400)
    throw new Error("Challenge already solved")
  }

  // Add to solved challenges
  profile.solvedChallenges.push({
    challengeId,
    solvedAt: new Date(),
  })

  // Update streak
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streakCount = profile.currentStreak?.count || 0
  let lastSolvedDate = profile.currentStreak?.lastSolvedDate
  
  if (lastSolvedDate) {
    const lastDate = new Date(lastSolvedDate)
    lastDate.setHours(0, 0, 0, 0)
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 1) {
      // Consecutive day, increment streak
      streakCount += 1
    } else if (daysDiff === 0) {
      // Same day, keep streak
      streakCount = streakCount
    } else {
      // Gap in streak, reset
      streakCount = 1
    }
  } else {
    // First solve
    streakCount = 1
  }

  profile.currentStreak = {
    count: streakCount,
    lastSolvedDate: new Date(),
  }

  await profile.save()

  res.status(200).json({
    message: "Challenge marked as solved!",
    streak: streakCount,
    solvedCount: profile.solvedChallenges.length,
  })
})

export { getCodingProfile, updateCodingProfile, getDailyRecommendations, refreshCodingStats, getDailyChallenges, solveChallengeHandler }
