import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useTheme } from "@/context/ThemeContext";

const WeeklyProgressChart = () => {
  const { isDarkMode } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("problems");

  useEffect(() => {
    const fetchWeeklyProgress = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/progress/weekly", {
          withCredentials: true,
        });

        // Transform data for chart
        const data = res.data.weeksData.map((item) => ({
          week: item.week,
          leetcode: item.data.platforms?.leetcode?.problemsSolved || 0,
          codeforces: item.data.platforms?.codeforces?.problemsSolved || 0,
          codechef: item.data.platforms?.codechef?.problemsSolved || 0,
          hackerrank: item.data.platforms?.hackerrank?.problemsSolved || 0,
          total: item.data.totalProblemsSolved || 0,
        }));

        setChartData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching weekly progress:", error);
        setLoading(false);
      }
    };

    fetchWeeklyProgress();
  }, []);

  if (loading) {
    return <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading chart...</div>;
  }

  const colors = {
    leetcode: "#FFA500",
    codeforces: "#1E90FF",
    codechef: "#8B4513",
    hackerrank: "#00CED1",
  };

  return (
    <div className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
      isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : ""}`}>
          📊 Weekly Performance Chart
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType("problems")}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              chartType === "problems"
                ? "bg-purple-600 text-white"
                : isDarkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Problems Solved
          </button>
          <button
            onClick={() => setChartType("contests")}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              chartType === "contests"
                ? "bg-purple-600 text-white"
                : isDarkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Contests
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          No data available yet. Start solving problems to see your progress!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === "problems" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
              <XAxis
                dataKey="week"
                stroke={isDarkMode ? "#999" : "#666"}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke={isDarkMode ? "#999" : "#666"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#333" : "#fff",
                  border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
                  borderRadius: "8px",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              />
              <Legend />
              <Bar dataKey="leetcode" fill={colors.leetcode} name="LeetCode" />
              <Bar dataKey="codeforces" fill={colors.codeforces} name="CodeForces" />
              <Bar dataKey="codechef" fill={colors.codechef} name="CodeChef" />
              <Bar dataKey="hackerrank" fill={colors.hackerrank} name="HackerRank" />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
              <XAxis
                dataKey="week"
                stroke={isDarkMode ? "#999" : "#666"}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke={isDarkMode ? "#999" : "#666"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#333" : "#fff",
                  border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
                  borderRadius: "8px",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="leetcode"
                stroke={colors.leetcode}
                name="LeetCode"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="codeforces"
                stroke={colors.codeforces}
                name="CodeForces"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="codechef"
                stroke={colors.codechef}
                name="CodeChef"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="hackerrank"
                stroke={colors.hackerrank}
                name="HackerRank"
                strokeWidth={2}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-700" : "bg-orange-50"}`}>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>LeetCode</p>
          <p className="text-2xl font-bold text-orange-600">
            {chartData[chartData.length - 1]?.leetcode || 0}
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>CodeForces</p>
          <p className="text-2xl font-bold text-blue-600">
            {chartData[chartData.length - 1]?.codeforces || 0}
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-700" : "bg-amber-50"}`}>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>CodeChef</p>
          <p className="text-2xl font-bold text-amber-700">
            {chartData[chartData.length - 1]?.codechef || 0}
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-700" : "bg-cyan-50"}`}>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>HackerRank</p>
          <p className="text-2xl font-bold text-cyan-600">
            {chartData[chartData.length - 1]?.hackerrank || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgressChart;
