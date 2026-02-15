import mongoose from "mongoose"

const weeklyProgressSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    week: {
      type: Date,
      required: true,
    },
    platforms: {
      leetcode: {
        problemsSolved: {
          type: Number,
          default: 0,
        },
        contestsParticipated: {
          type: Number,
          default: 0,
        },
        rating: {
          type: Number,
          default: 0,
        },
      },
      codeforces: {
        problemsSolved: {
          type: Number,
          default: 0,
        },
        contestsParticipated: {
          type: Number,
          default: 0,
        },
        rating: {
          type: Number,
          default: 0,
        },
      },
      codechef: {
        problemsSolved: {
          type: Number,
          default: 0,
        },
        contestsParticipated: {
          type: Number,
          default: 0,
        },
        rating: {
          type: Number,
          default: 0,
        },
      },
      hackerrank: {
        problemsSolved: {
          type: Number,
          default: 0,
        },
        contestsParticipated: {
          type: Number,
          default: 0,
        },
        rating: {
          type: Number,
          default: 0,
        },
      },
    },
    totalProblemsSolved: {
      type: Number,
      default: 0,
    },
    totalContestsParticipated: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

const WeeklyProgress = mongoose.model("WeeklyProgress", weeklyProgressSchema)

export default WeeklyProgress
