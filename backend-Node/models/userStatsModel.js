import mongoose from "mongoose"

const userStatsSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    resumeScore: {
      type: Number,
      default: 0,
    },
    interviewsGiven: {
      type: Number,
      default: 0,
    },
    lastInterviewScore: {
      type: Number,
      default: 0,
    },
    challengesCompleted: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

const UserStats = mongoose.model("UserStats", userStatsSchema)

export default UserStats
