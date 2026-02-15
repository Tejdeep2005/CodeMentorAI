import asyncHandler from "express-async-handler"
import axios from "axios"
import ContestCache from "../models/contestCacheModel.js"

// Cache update interval (6 hours)
const CACHE_UPDATE_INTERVAL = 6 * 60 * 60 * 1000

// @desc get upcoming contests
// @route /api/contests/upcoming
// @method get
const getUpcomingContests = asyncHandler(async (req, res) => {
  try {
    // Try to get from cache first
    let contests = await getContestsFromCache()

    // If cache is empty or expired, fetch fresh data
    if (contests.length === 0) {
      contests = await fetchAllContests()
      // Save to cache
      await saveContestsToCache(contests)
    }

    res.status(200).json({
      contests,
      lastUpdated: new Date().toISOString(),
      source: "cached",
    })
  } catch (error) {
    console.error("Error fetching contests:", error.message)
    // Return mock data if everything fails
    const mockContests = getMockContests()
    res.status(200).json({
      contests: mockContests,
      lastUpdated: new Date().toISOString(),
      source: "mock",
    })
  }
})

// Get contests from database cache
const getContestsFromCache = async () => {
  try {
    const caches = await ContestCache.find({})
    const now = new Date()
    let allContests = []

    for (const cache of caches) {
      // Check if cache is still valid
      if (cache.nextUpdateTime > now) {
        allContests = allContests.concat(
          cache.contests.map((c) => ({
            id: c.id,
            title: c.title,
            platform: cache.platform,
            startTime: new Date(c.startTime).toISOString(),
            duration: c.duration,
            link: c.link,
            difficulty: c.difficulty,
          }))
        )
      }
    }

    return allContests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  } catch (error) {
    console.error("Cache retrieval error:", error.message)
    return []
  }
}

// Save contests to cache
const saveContestsToCache = async (contests) => {
  try {
    const platforms = ["LeetCode", "CodeForces", "CodeChef"]
    const nextUpdateTime = new Date(Date.now() + CACHE_UPDATE_INTERVAL)

    for (const platform of platforms) {
      const platformContests = contests.filter((c) => c.platform === platform)

      if (platformContests.length > 0) {
        await ContestCache.findOneAndUpdate(
          { platform },
          {
            platform,
            contests: platformContests,
            lastUpdated: new Date(),
            nextUpdateTime,
          },
          { upsert: true, new: true }
        )
      }
    }
  } catch (error) {
    console.error("Cache save error:", error.message)
  }
}

// Fetch contests from all platforms
const fetchAllContests = async () => {
  const contests = []

  // Fetch LeetCode contests
  try {
    const leetcodeContests = await fetchLeetCodeContests()
    contests.push(...leetcodeContests)
  } catch (error) {
    console.error("LeetCode fetch error:", error.message)
  }

  // Fetch CodeForces contests
  try {
    const codeforcesContests = await fetchCodeForcesContests()
    contests.push(...codeforcesContests)
  } catch (error) {
    console.error("CodeForces fetch error:", error.message)
  }

  // Fetch CodeChef contests
  try {
    const codechefContests = await fetchCodeChefContests()
    contests.push(...codechefContests)
  } catch (error) {
    console.error("CodeChef fetch error:", error.message)
  }

  // Sort by start time
  return contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
}

// Fetch LeetCode contests
const fetchLeetCodeContests = async () => {
  try {
    // LeetCode doesn't have a public API for contests
    // Return mock data instead
    return getMockLeetCodeContests()
  } catch (error) {
    console.error("LeetCode fetch error:", error.message)
    return getMockLeetCodeContests()
  }
}

// Fetch CodeForces contests
const fetchCodeForcesContests = async () => {
  try {
    const response = await axios.get("https://codeforces.com/api/contest.list?gym=false", {
      timeout: 8000,
    })

    if (response.data.status === "OK") {
      const now = new Date().getTime() / 1000
      const upcomingContests = response.data.result
        .filter((contest) => contest.startTimeSeconds > now && !contest.finished)
        .slice(0, 5)
        .map((contest) => ({
          id: `cf-${contest.id}`,
          title: contest.name,
          platform: "CodeForces",
          startTime: new Date(contest.startTimeSeconds * 1000).toISOString(),
          duration: contest.durationSeconds,
          link: `https://codeforces.com/contests/${contest.id}`,
          difficulty: "Mixed",
        }))

      return upcomingContests
    }
    return []
  } catch (error) {
    console.error("CodeForces API error:", error.message)
    // Return mock data instead of failing
    return getMockCodeForcesContests()
  }
}

// Fetch CodeChef contests
const fetchCodeChefContests = async () => {
  try {
    // CodeChef doesn't have a public API, so we'll use mock data
    return getMockCodeChefContests()
  } catch (error) {
    console.error("CodeChef fetch error:", error.message)
    return getMockCodeChefContests()
  }
}

// Mock LeetCode contests
const getMockLeetCodeContests = () => {
  const now = new Date()
  return [
    {
      id: "lc-1",
      title: "Weekly Contest 380",
      platform: "LeetCode",
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 90 * 60,
      link: "https://leetcode.com/contest/weekly-contest-380/",
      difficulty: "Mixed",
    },
    {
      id: "lc-2",
      title: "Biweekly Contest 130",
      platform: "LeetCode",
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 90 * 60,
      link: "https://leetcode.com/contest/biweekly-contest-130/",
      difficulty: "Mixed",
    },
  ]
}

// Mock CodeForces contests
const getMockCodeForcesContests = () => {
  const now = new Date()
  return [
    {
      id: "cf-1",
      title: "Codeforces Round 920 (Div. 1 + Div. 2)",
      platform: "CodeForces",
      startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 2 * 60 * 60,
      link: "https://codeforces.com/contests/",
      difficulty: "Mixed",
    },
    {
      id: "cf-2",
      title: "Codeforces Round 921 (Div. 2)",
      platform: "CodeForces",
      startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 2 * 60 * 60,
      link: "https://codeforces.com/contests/",
      difficulty: "Mixed",
    },
  ]
}

// Mock CodeChef contests
const getMockCodeChefContests = () => {
  const now = new Date()
  return [
    {
      id: "cc-1",
      title: "CodeChef Starters 113",
      platform: "CodeChef",
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 3 * 60 * 60,
      link: "https://www.codechef.com/contests",
      difficulty: "Beginner",
    },
    {
      id: "cc-2",
      title: "CodeChef Cook-Off",
      platform: "CodeChef",
      startTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 2.5 * 60 * 60,
      link: "https://www.codechef.com/contests",
      difficulty: "Mixed",
    },
  ]
}

// Mock all contests
const getMockContests = () => {
  return [
    ...getMockLeetCodeContests(),
    ...getMockCodeForcesContests(),
    ...getMockCodeChefContests(),
  ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
}

// Background job to update contests periodically
export const startContestUpdateJob = async () => {
  console.log("Starting contest update job...")
  
  // Update immediately on startup
  try {
    const contests = await fetchAllContests()
    await saveContestsToCache(contests)
    console.log("Initial contest cache updated")
  } catch (error) {
    console.error("Initial contest update failed:", error.message)
  }

  // Then update every 6 hours
  setInterval(async () => {
    try {
      console.log("Updating contest cache...")
      const contests = await fetchAllContests()
      await saveContestsToCache(contests)
      console.log("Contest cache updated successfully")
    } catch (error) {
      console.error("Contest cache update failed:", error.message)
    }
  }, CACHE_UPDATE_INTERVAL)
}

export { getUpcomingContests }

