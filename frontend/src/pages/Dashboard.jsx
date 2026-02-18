import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import CountdownTimer from "@/components/CountdownTimer";
import WeeklyProgressChart from "@/components/WeeklyProgressChart";
import "./dashboard.css";

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
  const [streak, setStreak] = useState(() => {
    // Load streak from localStorage if available
    const cached = localStorage.getItem("userStreak");
    return cached ? JSON.parse(cached) : 0;
  });
  const [longestStreak, setLongestStreak] = useState(() => {
    // Load longest streak from localStorage if available
    const cached = localStorage.getItem("userLongestStreak");
    return cached ? JSON.parse(cached) : 0;
  });
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
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const [statsRes, profileRes, challengeRes, streakRes, contestsRes] = await Promise.all([
          axios.get(`${apiUrl}/api/users/stats`, {
            withCredentials: true,
          }),
          axios.get(`${apiUrl}/api/coding-profile`, {
            withCredentials: true,
          }),
          axios.get(`${apiUrl}/api/coding-profile/daily-challenge`, {
            withCredentials: true,
          }).catch(() => ({ data: null })),
          axios.get(`${apiUrl}/api/users/streak`, {
            withCredentials: true,
          }).catch(() => ({ data: { current: 0, longest: 0 } })),
          axios.get(`${apiUrl}/api/contests/upcoming`, {
            withCredentials: true,
          }).catch(() => ({ data: { contests: [] } })),
        ]);
        
        // Always update streak from backend and cache it
        setStreak(streakRes.data?.current || 0);
        setLongestStreak(streakRes.data?.longest || 0);
        localStorage.setItem("userStreak", JSON.stringify(streakRes.data?.current || 0));
        localStorage.setItem("userLongestStreak", JSON.stringify(streakRes.data?.longest || 0));
        
        // Cache other data in localStorage (but NOT challenges - they refresh daily)
        const dashboardData = {
          stats: statsRes.data,
          profile: profileRes.data,
          contests: contestsRes.data?.contests || [],
          timestamp: new Date().getTime(),
        };
        localStorage.setItem("dashboardCache", JSON.stringify(dashboardData));
        
        setStats(statsRes.data);
        setCodingProfile(profileRes.data);
        if (challengeRes.data) {
          setChallenges(challengeRes.data.challenges || []);
          setLeetcodeSolved(challengeRes.data.leetcodeSolved || 0);
          setSolvedCount(challengeRes.data.solvedCount || 0);
          setTotalChallenges(challengeRes.data.totalChallenges || 0);
        }
        if (contestsRes.data) {
          setContests(contestsRes.data.contests || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Try to load from cache if fetch fails
        const cached = localStorage.getItem("dashboardCache");
        if (cached) {
          const data = JSON.parse(cached);
          setStats(data.stats);
          setCodingProfile(data.profile);
          setContests(data.contests);
        }
      } finally {
        setLoading(false);
        setContestsLoading(false);
      }
    };

    if (user?._id) {
      // Try to load from cache first for faster initial load (but not challenges)
      const cached = localStorage.getItem("dashboardCache");
      if (cached) {
        const data = JSON.parse(cached);
        const cacheAge = new Date().getTime() - data.timestamp;
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setStats(data.stats);
          setCodingProfile(data.profile);
          setContests(data.contests);
          setLoading(false);
          setContestsLoading(false);
        }
      }
      
      // Always fetch fresh data from backend
      fetchData();
      // Refresh data every week (7 days)
      const contestInterval = setInterval(fetchData, 7 * 24 * 60 * 60 * 1000);
      return () => clearInterval(contestInterval);
    }
  }, [user]);

  const handleSolveChallenge = async (challengeId) => {
    setSolvingId(challengeId);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    try {
      const response = await axios.post(
        `${apiUrl}/api/coding-profile/solve-challenge`,
        { challengeId },
        { withCredentials: true }
      );

      // Update streak and solved count
      setStreak(response.data.streak);
      setSolvedCount(response.data.solvedCount);

      // Refresh challenges
      const challengeRes = await axios.get(
        `${apiUrl}/api/coding-profile/daily-challenge`,
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
    <div className="dashboard-container min-h-screen bg-black p-6 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 animate-pulse">
            👋 Welcome, {userName}!
          </h1>
          <p className="text-transparent bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-lg font-semibold">Track your progress and master DSA</p>
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
          <div className="lg:col-span-2 group relative backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30 rounded-3xl p-8 hover:from-white/25 hover:to-white/10 transition-all duration-500 shadow-2xl overflow-hidden">
            {/* Glossy shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full" style={{animation: 'shine 3s infinite'}}></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-2xl"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">🤖 AI Interview</h2>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                🎬
              </div>
            </div>
            {stats.lastInterviewScore > 0 ? (
              <>
                <p className="text-gray-300 mb-6 text-lg">Your last score: <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.lastInterviewScore}%</span></p>
                <button 
                  onClick={() => navigate("/app/interview")}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
                >
                  Start Mock Interview
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-lg">No interviews taken yet. Start your first mock interview!</p>
            )}
          </div>

          {/* Coding Progress Card */}
          <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30 rounded-3xl p-8 hover:from-white/25 hover:to-white/10 transition-all duration-500 shadow-2xl overflow-hidden">
            {/* Glossy shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full" style={{animation: 'shine 3s infinite'}}></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-2xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-black bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-6">💻 Coding Progress</h2>
              {!hasAnyProfile ? (
                <div>
                  <p className="text-sm text-gray-400 mb-4">Connect your coding profiles to track progress</p>
                  <Link
                    to="/app/coding-profiles"
                    className="inline-block w-full text-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Add Profiles
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {codingProfile?.leetcodeId && (
                    <div className="backdrop-blur-md bg-gradient-to-r from-orange-500/30 to-orange-500/10 border border-orange-500/50 rounded-xl p-4 hover:from-orange-500/40 hover:to-orange-500/20 transition-all duration-300">
                      <p className="font-bold text-orange-300">LeetCode</p>
                      <p className="text-xs text-gray-300">{codingProfile.leetcodeStats?.solved || 0} problems</p>
                    </div>
                  )}
                  {codingProfile?.hackerrankId && (
                    <div className="backdrop-blur-md bg-gradient-to-r from-green-500/30 to-green-500/10 border border-green-500/50 rounded-xl p-4 hover:from-green-500/40 hover:to-green-500/20 transition-all duration-300">
                      <p className="font-bold text-green-300">HackerRank</p>
                      <p className="text-xs text-gray-300">{codingProfile.hackerrankStats?.solved || 0} problems</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Challenges */}
        <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30 rounded-3xl p-8 hover:from-white/25 hover:to-white/10 transition-all duration-500 shadow-2xl mb-8 overflow-hidden">
          {/* Glossy shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full" style={{animation: 'shine 3s infinite'}}></div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-2xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-4">🎯 Daily Coding Challenges</h2>
            <p className="text-sm text-gray-400 mb-6 font-semibold">Solved: <span className="text-green-300 font-bold">{solvedCount}/{totalChallenges}</span></p>
            {challenges.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-300 mb-2 text-xl font-bold">🎉 All challenges completed!</p>
                <p className="text-sm text-gray-500">New challenges will appear tomorrow</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="group/card relative backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-5 hover:from-white/20 hover:to-white/10 transition-all duration-300 overflow-hidden">
                    {/* Card shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover/card:translate-x-full"></div>
                    
                    <div className="relative z-10 flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-sm mb-2">{challenge.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          challenge.difficulty === "Easy" ? "bg-green-500/40 text-green-200 border border-green-500/60" :
                          challenge.difficulty === "Medium" ? "bg-yellow-500/40 text-yellow-200 border border-yellow-500/60" :
                          "bg-red-500/40 text-red-200 border border-red-500/60"
                        }`}>
                          {challenge.difficulty}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">{challenge.description}</p>
                    <div className="flex gap-2">
                      <a
                        href={challenge.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-center bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-2 rounded-lg transition-all duration-300 font-semibold border border-white/20"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleSolveChallenge(challenge.id)}
                        disabled={solvingId === challenge.id}
                        className="flex-1 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 disabled:opacity-50 shadow-lg"
                      >
                        {solvingId === challenge.id ? "..." : "✓"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Streak & Contests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Streak Card */}
          <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30 rounded-3xl p-8 hover:from-white/25 hover:to-white/10 transition-all duration-500 shadow-2xl overflow-hidden">
            {/* Glossy shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full" style={{animation: 'shine 3s infinite'}}></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-2xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-black bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent mb-8">🔥 CodeMentor AI Streak</h2>
              <div className="text-center mb-8">
                <p className="text-6xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg">{streak}</p>
                <p className="text-gray-400 text-sm font-semibold mt-2">Day Streak</p>
                <p className="text-xs text-gray-500 mt-3">Longest: <span className="text-purple-300 font-black text-lg">{longestStreak}</span> days</p>
              </div>
              {streak > 0 ? (
                <div className="backdrop-blur-md bg-gradient-to-r from-orange-500/30 to-red-500/30 border border-orange-500/50 rounded-2xl p-6 hover:from-orange-500/40 hover:to-red-500/40 transition-all duration-300">
                  <p className="text-sm font-bold text-orange-300">Keep it up! 🎉</p>
                  <p className="text-xs text-orange-200 mt-2">Log in tomorrow to maintain your streak</p>
                </div>
              ) : (
                <div className="backdrop-blur-md bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-500/50 rounded-2xl p-6 hover:from-blue-500/40 hover:to-cyan-500/40 transition-all duration-300">
                  <p className="text-sm font-bold text-blue-300">Start your streak! 🚀</p>
                  <p className="text-xs text-blue-200 mt-2">Log in daily to build your streak</p>
                </div>
              )}
            </div>
          </div>

          {/* Contests Card */}
          <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30 rounded-3xl p-8 hover:from-white/25 hover:to-white/10 transition-all duration-500 shadow-2xl overflow-hidden">
            {/* Glossy shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full" style={{animation: 'shine 3s infinite'}}></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-2xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent mb-6">🏆 Upcoming Contests</h2>
              {contestsLoading ? (
                <p className="text-gray-400 font-semibold">Loading contests...</p>
              ) : contests.length === 0 ? (
                <p className="text-gray-400 font-semibold">No upcoming contests</p>
              ) : (
                <div className="space-y-3">
                  {contests.slice(0, 3).map((contest) => (
                    <a
                      key={contest.id}
                      href={contest.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/contest relative backdrop-blur-md bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-2xl p-4 hover:from-white/20 hover:to-white/10 transition-all duration-300 block overflow-hidden"
                    >
                      {/* Contest card shine */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/contest:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover/contest:translate-x-full"></div>
                      
                      <div className="relative z-10 flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-sm">{contest.title}</h3>
                          <p className="text-xs text-gray-400 font-semibold">{contest.platform}</p>
                        </div>
                      </div>
                      <CountdownTimer startTime={contest.startTime} title={contest.title} />
                    </a>
                  ))}
                </div>
              )}
            </div>
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
    <div className="stat-card group relative backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30 rounded-2xl p-6 hover:from-white/25 hover:to-white/10 transition-all duration-500 shadow-2xl overflow-hidden">
      {/* Glossy shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full" style={{animation: 'shine 3s infinite'}}></div>
      
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl blur-xl`}></div>
      
      <div className="relative z-10 flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{value}</p>
    </div>
  );
}