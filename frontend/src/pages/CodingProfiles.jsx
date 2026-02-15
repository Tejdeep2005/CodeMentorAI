import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { CodingProfileForm } from "@/components/CodingProfileForm";
import { DailyRecommendations } from "@/components/DailyRecommendations";

export default function CodingProfiles() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen p-6 space-y-6 transition-colors duration-300 ${
      isDarkMode ? "bg-gray-900" : "bg-[#f9fafb]"
    }`}>
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Coding Profiles</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Connect your coding platform accounts to track progress and get personalized recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CodingProfileForm />
        </div>
        <div>
          <DailyRecommendations />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <div className="text-3xl mb-2">🎯</div>
          <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? "text-white" : ""}`}>LeetCode</h3>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Track your problem-solving progress across easy, medium, and hard problems
          </p>
        </div>
        <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <div className="text-3xl mb-2">🏆</div>
          <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? "text-white" : ""}`}>HackerRank</h3>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Monitor your HackerRank challenges and skill certifications
          </p>
        </div>
        <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <div className="text-3xl mb-2">📊</div>
          <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? "text-white" : ""}`}>CodeChef</h3>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Track your CodeChef rating and contest participation
          </p>
        </div>
        <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <div className="text-3xl mb-2">💚</div>
          <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? "text-white" : ""}`}>GeeksforGeeks</h3>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Track your GFG problems solved and score progress
          </p>
        </div>
      </div>
    </div>
  );
}
