import mongoose from "mongoose"

const contestCacheSchema = mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["LeetCode", "CodeForces", "CodeChef"],
      required: true,
    },
    contests: [
      {
        id: String,
        title: String,
        startTime: Date,
        duration: Number,
        link: String,
        difficulty: String,
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    nextUpdateTime: {
      type: Date,
      default: () => new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
    },
  },
  {
    timestamps: true,
  }
)

const ContestCache = mongoose.model("ContestCache", contestCacheSchema)

export default ContestCache
