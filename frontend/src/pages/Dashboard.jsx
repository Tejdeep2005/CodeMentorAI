import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import CountdownTimer from "@/components/CountdownTimer";
import WeeklyProgressChart from "@/components/WeeklyProgressChart";
import { ExternalLink } from "lucide-react";

export default function Dashboard() {
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👋 Welcome, {userName}!</h1>
          <p className="text-gray-400">Track your progress and master DSA</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Resume Score" 
            value={loading ? "-" : `${stats.resumeScore}%`}
            icon="📄"
            gradient="from-orange-500 to-red-500"
          />
          <StatCard 
            title="Interviews" 
            value={loading ? "-" : stats.interviewsGiven}
            icon="🎤"
            gradient="from-purple-500 to-pink-500"
          />
          <StatCard 
            title="Last Score" 
            value={loading ? "-" : `${stats.lastInterviewScore}%`}
            icon="⭐"
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard 
            title="Challenges" 
            value={loading ? "-" : leetcodeSolved}
            icon="🎯"
            gradient="from-green-500 to-emerald-500"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AI Interview Card */}
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">🤖 AI Interview</h2>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                🎬
              </div>
            </div>
            {stats.lastInterviewScore > 0 ? (
              <>
                <p className="text-gray-300 mb-4">Your last score: <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.lastInterviewScore}%</span></p>
                <button 
                  onClick={() => navigate("/app/interview")}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Start Mock Interview
                </button>
              </>
            ) : (
              <p className="text-gray-400">No interviews taken yet. Start your first mock interview!</p>
            )}
          </div>

          {/* Coding Progress Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">💻 Coding Progress</h2>
            {!hasAnyProfile ? (
              <div>
                <p className="text-sm text-gray-400 mb-4">Connect your coding profiles to track progress</p>
                <Link
                  to="/app/coding-profiles"
                  className="inline-block w-full text-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                >
                  Add Profiles
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {codingProfile?.leetcodeId && (
                  <div className="bg-gradient-to-r from-orange-500/20 to-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <p className="font-semibold text-orange-400">LeetCode</p>
                    <p className="text-xs text-gray-400">{codingProfile.leetcodeStats?.solved || 0} problems</p>
                  </div>
                )}
                {codingProfile?.hackerrankId && (
                  <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="font-semibold text-green-400">HackerRank</p>
                    <p className="text-xs text-gray-400">{codingProfile.hackerrankStats?.solved || 0} problems</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Daily Challenges */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">🎯 Daily Coding Challenges</h2>
          <p className="text-sm text-gray-400 mb-4">Solved: {solvedCount}/{totalChallenges}</p>
          {challenges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">🎉 All challenges completed!</p>
              <p className="text-sm text-gray-500">New challenges will appear tomorrow</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm mb-1">{challenge.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        challenge.difficulty === "Easy" ? "bg-green-500/30 text-green-300" :
                        challenge.difficulty === "Medium" ? "bg-yellow-500/30 text-yellow-300" :
                        "bg-red-500/30 text-red-300"
                      }`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{challenge.description}</p>
                  <div className="flex gap-2">
                    <a
                      href={challenge.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs text-center bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-2 rounded-lg transition-all duration-300"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleSolveChallenge(challenge.id)}
                      disabled={solvingId === challenge.id}
                      className="flex-1 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-2 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                    >
                      {solvingId === challenge.id ? "..." : "✓"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streak & Contests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Streak Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">🔥 CodeMentor AI Streak</h2>
            <div className="text-center mb-6">
              <p className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{streak}</p>
              <p className="text-gray-400 text-sm">Day Streak</p>
              <p className="text-xs text-gray-500 mt-2">Longest: <span className="text-purple-400 font-bold">{longestStreak}</span> days</p>
            </div>
            {streak > 0 ? (
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-orange-300">Keep it up! 🎉</p>
                <p className="text-xs text-orange-200 mt-1">Log in tomorrow to maintain your streak</p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-300">Start your streak! 🚀</p>
                <p className="text-xs text-blue-200 mt-1">Log in daily to build your streak</p>
              </div>
            )}
          </div>

          {/* Contests Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">🏆 Upcoming Contests</h2>
            {contestsLoading ? (
              <p className="text-gray-400">Loading contests...</p>
            ) : contests.length === 0 ? (
              <p className="text-gray-400">No upcoming contests</p>
            ) : (
              <div className="space-y-3">
                {contests.slice(0, 3).map((contest) => (
                  <div key={contest.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">{contest.title}</h3>
                        <p className="text-xs text-gray-400">{contest.platform}</p>
                      </div>
                    </div>
                    <CountdownTimer startTime={contest.startTime} title={contest.title} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <WeeklyProgressChart />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient }) {
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-gray-400">{title}</h3>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-lg`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}