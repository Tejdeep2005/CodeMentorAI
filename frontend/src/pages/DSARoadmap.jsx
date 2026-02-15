import React, { useState } from "react";
import { dsaRoadmap } from "../data/dsaRoadmap";
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Circle } from "lucide-react";

const DSARoadmap = () => {
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
        return "text-green-600 bg-green-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      case "Hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 DSA Mastery Roadmap</h1>
          <p className="text-gray-600">Master Data Structures & Algorithms with a structured learning path</p>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Progress</h2>
            <span className="text-2xl font-bold text-purple-600">
              {solvedCount}/{totalProblems}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{progressPercentage}% Complete</p>
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
            className={`bg-white rounded-lg shadow-md overflow-hidden transition ${getCategoryColor(
              category.difficulty
            )}`}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4 text-left">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{category.category}</h3>
                  <p className="text-sm text-gray-500">
                    {category.problems.filter((p) => solvedProblems.has(p.id)).length}/
                    {category.problems.length} problems solved
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {category.difficulty}
                </span>
                {expandedCategory === category.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </button>

            {/* Problems List */}
            {expandedCategory === category.id && (
              <div className="border-t border-gray-200 divide-y">
                {category.problems.map((problem) => (
                  <div
                    key={problem.id}
                    className={`px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition ${
                      solvedProblems.has(problem.id) ? "bg-green-50" : ""
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
                        <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* Problem Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4
                            className={`font-semibold text-gray-800 ${
                              solvedProblems.has(problem.id)
                                ? "line-through text-gray-500"
                                : ""
                            }`}
                          >
                            {problem.title}
                          </h4>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {problem.topics.map((topic) => (
                              <span
                                key={topic}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
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
      <div className="max-w-6xl mx-auto mt-12 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{totalProblems}</p>
            <p className="text-sm text-gray-600">Total Problems</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{solvedCount}</p>
            <p className="text-sm text-gray-600">Problems Solved</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{totalProblems - solvedCount}</p>
            <p className="text-sm text-gray-600">Remaining</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{progressPercentage}%</p>
            <p className="text-sm text-gray-600">Progress</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSARoadmap;
