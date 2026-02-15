import mongoose from "mongoose"

const codingProfileSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    leetcodeId: {
      type: String,
      default: "",
    },
    hackerrankId: {
      type: String,
      default: "",
    },
    codechefId: {
      type: String,
      default: "",
    },
    geeksforgeeksId: {
      type: String,
      default: "",
    },
    leetcodeStats: {
      solved: { type: Number, default: 0 },
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      totalActiveDays: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: null },
    },
    hackerrankStats: {
      solved: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: null },
    },
    codechefStats: {
      solved: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: null },
    },
    geeksforgeeksStats: {
      solved: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: null },
    },
    solvedChallenges: [
      {
        challengeId: { type: Number, required: true },
        solvedAt: { type: Date, default: Date.now },
        difficulty: { type: String, default: "Easy" },
      },
    ],
    currentStreak: {
      count: { type: Number, default: 0 },
      lastSolvedDate: { type: Date, default: null },
    },
    dailyChallenges: {
      lastResetDate: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
)

const CodingProfile = mongoose.model("CodingProfile", codingProfileSchema)

export default CodingProfile
