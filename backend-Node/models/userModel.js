import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    streak: {
      current: {
        type: Number,
        default: 0,
      },
      longest: {
        type: Number,
        default: 0,
      },
      lastLoginDate: {
        type: Date,
        default: null,
      },
    },
    emailNotifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      dailyProgress: {
        type: Boolean,
        default: true,
      },
      weeklyReport: {
        type: Boolean,
        default: true,
      },
      contestReminders: {
        type: Boolean,
        default: true,
      },
      lastEmailSent: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next()
    return
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.updateStreak = function () {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastLogin = this.streak.lastLoginDate ? new Date(this.streak.lastLoginDate) : null
  if (lastLogin) {
    lastLogin.setHours(0, 0, 0, 0)
  }

  const timeDiff = today - lastLogin
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

  // If logged in today, don't update streak
  if (daysDiff === 0) {
    return this.streak.current
  }

  // If logged in yesterday, increment streak
  if (daysDiff === 1) {
    this.streak.current += 1
  } else {
    // If more than 1 day gap, reset streak to 1
    this.streak.current = 1
  }

  // Update longest streak if current exceeds it
  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current
  }

  // Update last login date
  this.streak.lastLoginDate = new Date()

  return this.streak.current
}

const User = mongoose.model("User", userSchema)

export default User
