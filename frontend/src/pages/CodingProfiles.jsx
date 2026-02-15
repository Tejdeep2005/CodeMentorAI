import React from "react";
import { CodingProfileForm } from "@/components/CodingProfileForm";
import { DailyRecommendations } from "@/components/DailyRecommendations";

export default function CodingProfiles() {
  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Coding Profiles</h1>
        <p className="text-gray-600">
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
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-semibold text-lg mb-2">LeetCode</h3>
          <p className="text-gray-600 text-sm">
            Track your problem-solving progress across easy, medium, and hard problems
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-semibold text-lg mb-2">HackerRank</h3>
          <p className="text-gray-600 text-sm">
            Monitor your HackerRank challenges and skill certifications
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-lg mb-2">CodeChef</h3>
          <p className="text-gray-600 text-sm">
            Track your CodeChef rating and contest participation
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl mb-2">💚</div>
          <h3 className="font-semibold text-lg mb-2">GeeksforGeeks</h3>
          <p className="text-gray-600 text-sm">
            Track your GFG problems solved and score progress
          </p>
        </div>
      </div>
    </div>
  );
}
