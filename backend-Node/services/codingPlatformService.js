import axios from "axios"

// Fetch LeetCode stats
export const fetchLeetCodeStats = async (username) => {
  try {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      {
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
                totalSubmissionNum {
                  difficulty
                  count
                }
              }
              userCalendar {
                activeYears
                streak
                totalActiveDays
              }
            }
          }
        `,
        variables: { username },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (response.data.data?.matchedUser) {
      const submitStats = response.data.data.matchedUser.submitStatsGlobal
      const userCalendar = response.data.data.matchedUser.userCalendar
      
      // Use acSubmissionNum which is ACCEPTED submissions only
      const acStats = submitStats.acSubmissionNum
      console.log("LeetCode AC Stats:", JSON.stringify(acStats, null, 2))
      
      // Find the "All" entry which contains the total accepted
      const allEntry = acStats.find((s) => s.difficulty === "All")
      
      let solvedCount = 0
      if (allEntry) {
        console.log("Using All entry:", allEntry.count)
        solvedCount = allEntry.count
      } else {
        // If no "All" entry, sum only the difficulty levels (not "All")
        const easyCount = acStats.find((s) => s.difficulty === "Easy")?.count || 0
        const mediumCount = acStats.find((s) => s.difficulty === "Medium")?.count || 0
        const hardCount = acStats.find((s) => s.difficulty === "Hard")?.count || 0
        solvedCount = easyCount + mediumCount + hardCount
        console.log("Calculated totals - Easy:", easyCount, "Medium:", mediumCount, "Hard:", hardCount, "Total:", solvedCount)
      }

      return {
        solved: solvedCount,
        easy: acStats.find((s) => s.difficulty === "Easy")?.count || 0,
        medium: acStats.find((s) => s.difficulty === "Medium")?.count || 0,
        hard: acStats.find((s) => s.difficulty === "Hard")?.count || 0,
        streak: userCalendar?.streak || 0,
        totalActiveDays: userCalendar?.totalActiveDays || 0,
        lastUpdated: new Date(),
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching LeetCode stats:", error.message)
    return null
  }
}

// Fetch HackerRank stats
export const fetchHackerRankStats = async (username) => {
  try {
    // Try to get basic profile info
    const profileResponse = await axios.get(
      `https://www.hackerrank.com/rest/hackers/${username}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    )

    if (profileResponse.data?.model) {
      const profile = profileResponse.data.model
      
      // HackerRank doesn't expose solved problems count via public API
      // We return the profile info and a note that manual entry is needed
      console.log(`HackerRank profile found for ${username}`)
      
      return {
        username: profile.username,
        name: profile.name,
        country: profile.country,
        level: profile.level,
        solved: 0, // HackerRank doesn't expose this publicly
        note: "HackerRank solved problems count is not publicly available. Please enter manually or check your HackerRank profile.",
        lastUpdated: new Date(),
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching HackerRank stats:", error.message)
    return null
  }
}

// Fetch GeeksforGeeks stats
export const fetchGeeksforGeeksStats = async (username) => {
  try {
    // Try the main API endpoint
    const response = await axios.get(
      `https://auth.geeksforgeeks.org/user/${username}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    )

    if (response.data?.success && response.data?.data) {
      const userData = response.data.data
      
      return {
        solved: userData.totalProblems || 0,
        score: userData.score || 0,
        streak: userData.streak || 0,
        lastUpdated: new Date(),
      }
    }
    
    // If main API fails, try alternative endpoint
    try {
      const altResponse = await axios.get(
        `https://www.geeksforgeeks.org/user/${username}/`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      )
      
      // Parse HTML to extract stats (fallback)
      const html = altResponse.data
      const solvedMatch = html.match(/Problems Solved[:\s]*(\d+)/i)
      const scoreMatch = html.match(/Score[:\s]*(\d+)/i)
      
      return {
        solved: solvedMatch ? parseInt(solvedMatch[1]) : 0,
        score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
        streak: 0,
        lastUpdated: new Date(),
      }
    } catch (altError) {
      console.error("Alternative GFG endpoint also failed:", altError.message)
      return null
    }
  } catch (error) {
    console.error("Error fetching GeeksforGeeks stats:", error.message)
    
    // Return null so user can manually enter the count
    return null
  }
}

// Fetch CodeChef stats
export const fetchCodeChefStats = async (username) => {
  try {
    const response = await axios.get(
      `https://codechef.com/api/contests/all/users/${username}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    )

    if (response.data) {
      // CodeChef API returns contest data, we'll extract rating if available
      const rating = response.data.rating || 0
      const solved = response.data.fully_solved || 0

      return {
        solved,
        rating,
        lastUpdated: new Date(),
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching CodeChef stats:", error.message)
    return null
  }
}

// Fetch all stats
export const fetchAllStats = async (leetcodeId, hackerrankId, codechefId, geeksforgeeksId) => {
  const results = {}

  if (leetcodeId) {
    results.leetcodeStats = await fetchLeetCodeStats(leetcodeId)
  }

  if (hackerrankId) {
    results.hackerrankStats = await fetchHackerRankStats(hackerrankId)
  }

  if (codechefId) {
    results.codechefStats = await fetchCodeChefStats(codechefId)
  }

  if (geeksforgeeksId) {
    results.geeksforgeeksStats = await fetchGeeksforGeeksStats(geeksforgeeksId)
  }

  return results
}
