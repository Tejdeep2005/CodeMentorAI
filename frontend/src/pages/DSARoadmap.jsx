import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { dsaRoadmap } from "../data/dsaRoadmap";
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Circle } from "lucide-react";

const DSARoadmap = () => {
  const { isDarkMode } = useTheme();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const [filterDifficulty, setFilterDifficulty] = useState("All");

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleProblemSolved = (problemId) => {
    const newSolved = new Set(solvedProblems);
    if (newSolved.has(problemId)) {
      newSolved.delete(problemId);
    } else {
      newSolved.add(problemId);
    }
    setSolvedProblems(newSolved);
  };

  const filteredRoadmap =
    filterDifficulty === "All"
      ? dsaRoadmap
      : dsaRoadmap.filter((cat) => cat.difficulty === filterDifficulty);

  const totalProblems = dsaRoadmap.reduce((sum, cat) => sum + cat.problems.length, 0);
  const solvedCount = solvedProblems.size;
  const progressPercentage = Math.round((solvedCount / totalProblems) * 100);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return isDarkMode ? "text-green-400 bg-green-900" : "text-green-600 bg-green-50";
      case "Medium":
        return isDarkMode ? "text-yellow-400 bg-yellow-900" : "text-yellow-600 bg-yellow-50";
      case "Hard":
        return isDarkMode ? "text-red-400 bg-red-900" : "text-red-600 bg-red-50";
      default:
        return isDarkMode ? "text-gray-400 bg-gray-700" : "text-gray-600 bg-gray-50";
    }
  };

  const getCategoryColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "border-l-4 border-green-500";
      case "Intermediate":
        return "border-l-4 border-blue-500";
      case "Advanced":
        return "border-l-4 border-purple-500";
      default:
        return "border-l-4 border-gray-500";
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 to-gray-800" 
        : "bg-gradient-to-br from-slate-50 to-slate-100"
    }`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>📚 DSA Mastery Roadmap</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Master Data Structures & Algorithms with a structured learning path</p>
        </div>

        {/* Progress Section */}
        <div className={`rounded-lg shadow-md p-6 mb-8 transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Your Progress</h2>
            <span className={`text-2xl font-bold ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
              {solvedCount}/{totalProblems}
            </span>
          </div>
          <div className={`w-full rounded-full h-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{progressPercentage}% Complete</p>
        </div>

        {/* Filter Section */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {["All", "Beginner", "Intermediate", "Advanced"].map((level) => (
            <button
              key={level}
              onClick={() => setFilterDifficulty(level)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterDifficulty === level
                  ? "bg-purple-600 text-white"
                  : isDarkMode
                  ? "bg-gray-800 text-gray-300 border border-gray-700 hover:border-purple-400"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-purple-400"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Roadmap Categories */}
      <div className="max-w-6xl mx-auto space-y-4">
        {filteredRoadmap.map((category) => (
          <div
            key={category.id}
            className={`rounded-lg shadow-md overflow-hidden transition ${getCategoryColor(
              category.difficulty
            )} ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className={`w-full px-6 py-4 flex justify-between items-center transition ${
                isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4 text-left">
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{category.category}</h3>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {category.problems.filter((p) => solvedProblems.has(p.id)).length}/
                    {category.problems.length} problems solved
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                }`}>
                  {category.difficulty}
                </span>
                {expandedCategory === category.id ? (
                  <ChevronUp className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
                )}
              </div>
            </button>

            {/* Problems List */}
            {expandedCategory === category.id && (
              <div className={`border-t divide-y ${isDarkMode ? "border-gray-700 divide-gray-700" : "border-gray-200"}`}>
                {category.problems.map((problem) => (
                  <div
                    key={problem.id}
                    className={`px-6 py-4 flex items-start gap-4 transition ${
                      isDarkMode
                        ? solvedProblems.has(problem.id)
                          ? "bg-green-900 bg-opacity-30 hover:bg-opacity-40"
                          : "hover:bg-gray-700"
                        : solvedProblems.has(problem.id)
                        ? "bg-green-50 hover:bg-green-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleProblemSolved(problem.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {solvedProblems.has(problem.id) ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className={`w-6 h-6 ${isDarkMode ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"}`} />
                      )}
                    </button>

                    {/* Problem Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4
                            className={`font-semibold ${
                              solvedProblems.has(problem.id)
                                ? isDarkMode
                                  ? "line-through text-gray-500"
                                  : "line-through text-gray-500"
                                : isDarkMode
                                ? "text-white"
                                : "text-gray-800"
                            }`}
                          >
                            {problem.title}
                          </h4>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {problem.topics.map((topic) => (
                              <span
                                key={topic}
                                className={`text-xs px-2 py-1 rounded ${
                                  isDarkMode
                                    ? "bg-blue-900 text-blue-300"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${getDifficultyColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty}
                          </span>
                          <a
                            href={problem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition"
                          >
                            <span>{problem.platform}</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className={`max-w-6xl mx-auto mt-12 rounded-lg shadow-md p-6 transition-colors duration-300 ${
        isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}>📊 Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className={`text-3xl font-bold ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>{totalProblems}</p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Problems</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-bold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>{solvedCount}</p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Problems Solved</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>{totalProblems - solvedCount}</p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Remaining</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-bold ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>{progressPercentage}%</p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Progress</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSARoadmap;
