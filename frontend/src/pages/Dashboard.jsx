import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import { Link } from "react-router-dom";
import CountdownTimer from "@/components/CountdownTimer";
import WeeklyProgressChart from "@/components/WeeklyProgressChart";
import { ExternalLink } from "lucide-react";

export default function Dashboard() {
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const userName = user?.name || "User";
  const [stats, setStats] = useState({
    resumeScore: 0,
    interviewsGiven: 0,
    lastInterviewScore: 0,
    challengesCompleted: 0,
  });
  const [codingProfile, setCodingProfile] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [leetcodeSolved, setLeetcodeSolved] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [solvingId, setSolvingId] = useState(null);
  const [contests, setContests] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, profileRes, challengeRes, streakRes, contestsRes] = await Promise.all([
          axios.get("http://localhost:3000/api/users/stats", {
            withCredentials: true,
          }),
          axios.get("http://localhost:3000/api/coding-profile", {
            withCredentials: true,
          }),
          axios.get("http://localhost:3000/api/coding-profile/daily-challenge", {
            withCredentials: true,
          }).catch(() => ({ data: null })),
          axios.get("http://localhost:3000/api/users/streak", {
            withCredentials: true,
          }).catch(() => ({ data: { current: 0, longest: 0 } })),
          axios.get("http://localhost:3000/api/contests/upcoming", {
            withCredentials: true,
          }).catch(() => ({ data: { contests: [] } })),
        ]);
        setStats(statsRes.data);
        setCodingProfile(profileRes.data);
        if (challengeRes.data) {
          setChallenges(challengeRes.data.challenges || []);
          setLeetcodeSolved(challengeRes.data.leetcodeSolved || 0);
          setSolvedCount(challengeRes.data.solvedCount || 0);
          setTotalChallenges(challengeRes.data.totalChallenges || 0);
        }
        // Set CodeMentor AI streak
        if (streakRes.data) {
          setStreak(streakRes.data.current || 0);
          setLongestStreak(streakRes.data.longest || 0);
        }
        // Set contests
        if (contestsRes.data) {
          setContests(contestsRes.data.contests || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
        setContestsLoading(false);
      }
    };

    if (user?._id) {
      fetchData();
      // Refresh contests every hour
      const contestInterval = setInterval(fetchData, 60 * 60 * 1000);
      return () => clearInterval(contestInterval);
    }
  }, [user]);

  const handleSolveChallenge = async (challengeId) => {
    setSolvingId(challengeId);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/coding-profile/solve-challenge",
        { challengeId },
        { withCredentials: true }
      );

      // Update streak and solved count
      setStreak(response.data.streak);
      setSolvedCount(response.data.solvedCount);

      // Refresh challenges
      const challengeRes = await axios.get(
        "http://localhost:3000/api/coding-profile/daily-challenge",
        { withCredentials: true }
      );
      setChallenges(challengeRes.data.challenges || []);

      // Show success message
      alert(`✅ Challenge solved! Streak: ${response.data.streak} days`);
    } catch (error) {
      console.error("Error solving challenge:", error);
      alert("❌ Error marking challenge as solved");
    } finally {
      setSolvingId(null);
    }
  };

  const hasAnyProfile = codingProfile?.leetcodeId || codingProfile?.hackerrankId || codingProfile?.codechefId;

  return (
    <div className={`min-h-screen p-6 space-y-6 transition-colors duration-300 ${
      isDarkMode ? "bg-gray-900" : "bg-[#f9fafb]"
    }`}>
      {/* Header */}
      <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>👋 Welcome, {userName}!</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Resume Score" value={loading ? "-" : `${stats.resumeScore}%`} />
        <StatCard title="Interviews Given" value={loading ? "-" : stats.interviewsGiven} />
        <StatCard title="Past Interview Score" value={loading ? "-" : `${stats.lastInterviewScore}%`} />
        <StatCard title="Challenges Completed" value={loading ? "-" : leetcodeSolved} icon="🎯" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Interview */}
        <div className={`p-6 rounded-xl shadow-md col-span-2 transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>🤖 AI Interview</h2>
          {stats.lastInterviewScore > 0 ? (
            <>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Your last score: <span className={`font-bold ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>{stats.lastInterviewScore}%</span></p>
              <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Start Mock Interview
              </button>
            </>
          ) : (
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>No interviews taken yet. Start your first mock interview!</p>
          )}
        </div>

        {/* Coding Progress */}
        <div className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>💻 Coding Progress</h2>
          {!hasAnyProfile ? (
            <div>
              <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Connect your coding profiles to track progress</p>
              <Link
                to="/app/coding-profiles"
                className="inline-block bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
              >
                Add Profiles
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {codingProfile?.leetcodeId && (
                <div className={`border-l-4 border-orange-500 pl-3 ${isDarkMode ? "bg-gray-700 p-2 rounded" : ""}`}>
                  <p className={`font-semibold text-sm ${isDarkMode ? "text-white" : ""}`}>LeetCode</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {codingProfile.leetcodeStats?.solved || 0} problems solved
                  </p>
                </div>
              )}
              {codingProfile?.hackerrankId && (
                <div className={`border-l-4 border-green-500 pl-3 ${isDarkMode ? "bg-gray-700 p-2 rounded" : ""}`}>
                  <p className={`font-semibold text-sm ${isDarkMode ? "text-white" : ""}`}>HackerRank</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {codingProfile.hackerrankStats?.solved || 0} problems solved
                  </p>
                </div>
              )}
              {codingProfile?.codechefId && (
                <div className={`border-l-4 border-purple-500 pl-3 ${isDarkMode ? "bg-gray-700 p-2 rounded" : ""}`}>
                  <p className={`font-semibold text-sm ${isDarkMode ? "text-white" : ""}`}>CodeChef</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Rating: {codingProfile.codechefStats?.rating || 0}
                  </p>
                </div>
              )}
              {codingProfile?.geeksforgeeksId && (
                <div className={`border-l-4 border-green-700 pl-3 ${isDarkMode ? "bg-gray-700 p-2 rounded" : ""}`}>
                  <p className={`font-semibold text-sm ${isDarkMode ? "text-white" : ""}`}>GeeksforGeeks</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {codingProfile.geeksforgeeksStats?.solved || 0} problems solved
                  </p>
                </div>
              )}
              <Link
                to="/app/coding-profiles"
                className={`inline-block text-xs hover:underline mt-2 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
              >
                View Details →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Coding Challenges */}
        <div className={`p-6 rounded-xl shadow-md col-span-2 transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>🎯 Daily Coding Challenges</h2>
          <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Solved: {solvedCount}/{totalChallenges} | Complete challenges to unlock new ones!
          </p>
          {challenges.length === 0 ? (
            <div className="text-center py-8">
              <p className={isDarkMode ? "text-gray-400 mb-4" : "text-gray-600 mb-4"}>🎉 All challenges completed!</p>
              <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>New challenges will appear tomorrow or refresh the page</p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <div key={challenge.id} className={`border rounded-lg p-3 transition-colors duration-300 ${
                  isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-sm ${isDarkMode ? "text-white" : ""}`}>{challenge.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          challenge.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                          challenge.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {challenge.difficulty}
                        </span>
                      </div>
                      <p className={`text-xs mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{challenge.description}</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={challenge.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs hover:underline ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                        >
                          View on LeetCode →
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSolveChallenge(challenge.id)}
                      disabled={solvingId === challenge.id}
                      className="ml-4 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {solvingId === challenge.id ? "Marking..." : "✓ Solved"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Reminder & Streak */}
        <div className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : ""}`}>🔥 CodeMentor AI Streak</h2>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-600">{streak}</p>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Day Streak</p>
              <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                Longest: <span className="font-bold text-purple-600">{longestStreak}</span> days
              </p>
            </div>
            {streak > 0 ? (
              <div className={`border-l-4 border-orange-500 p-3 rounded ${isDarkMode ? "bg-gray-700" : "bg-orange-50"}`}>
                <p className={`text-sm font-semibold ${isDarkMode ? "text-orange-400" : "text-orange-900"}`}>Keep it up! 🎉</p>
                <p className={`text-xs mt-1 ${isDarkMode ? "text-orange-300" : "text-orange-800"}`}>
                  Log in tomorrow to maintain your streak
                </p>
              </div>
            ) : (
              <div className={`border-l-4 border-blue-500 p-3 rounded ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <p className={`text-sm font-semibold ${isDarkMode ? "text-blue-400" : "text-blue-900"}`}>Start your streak! 🚀</p>
                <p className={`text-xs mt-1 ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
                  Log in daily to build your CodeMentor AI streak
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className={`text-xs font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>This Week</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center font-semibold ${
                      day <= streak ? "bg-orange-500 text-white" : isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Contests */}
      <div className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
        isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : ""}`}>🏆 Upcoming Contests</h2>
        {contestsLoading ? (
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading contests...</p>
        ) : contests.length === 0 ? (
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No upcoming contests found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contests.slice(0, 6).map((contest) => (
              <div
                key={contest.id}
                className={`border rounded-lg p-4 transition-colors duration-300 flex flex-col ${
                  isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${isDarkMode ? "text-white" : ""}`}>{contest.title}</h3>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {contest.platform}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap ml-2 ${
                    contest.platform === "LeetCode" ? "bg-orange-100 text-orange-800" :
                    contest.platform === "CodeForces" ? "bg-blue-100 text-blue-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    {contest.platform}
                  </span>
                </div>
                
                <div className="mb-3 py-2">
                  <CountdownTimer startTime={contest.startTime} title={contest.title} />
                </div>

                <p className={`text-xs mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {new Date(contest.startTime).toLocaleString()}
                </p>

                <a
                  href={contest.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition w-full"
                >
                  <span>Register</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Progress Chart */}
      <WeeklyProgressChart />
    </div>
  );
}

function StatCard({ title, value, icon }) {
  const { isDarkMode } = useTheme();
  return (
    <div className={`p-4 rounded-xl shadow text-center transition-colors duration-300 ${
      isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
    }`}>
      <h3 className={`text-md ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{icon} {title}</h3>
      <p className={`text-2xl font-bold ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>{value}</p>
    </div>
  );
}