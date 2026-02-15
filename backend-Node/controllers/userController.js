import asyncHandler from "express-async-handler"
import User from "../models/userModel.js"
import UserStats from "../models/userStatsModel.js"
import generateToken from "../utils/generateToken.js"

// @desc user token
// route /api/users/auth
// @method post
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })

  if (user && (await user.matchPassword(password))) {
    // Update streak on login
    user.updateStreak()
    await user.save()

    generateToken(res, user._id)

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      streak: user.streak.current,
      longestStreak: user.streak.longest,
    })
  } else {
    res.status(401)
    throw new Error("Invalid email or password")
  }
})

// @desc register user
// route /api/users
// @method post
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400)
    throw new Error("User already exists")
  }

  const user = await User.create({
    name,
    email,
    password,
  })

  if (!user) {
    res.status(400)
    throw new Error("Invalid data")
  }

  // Create user stats record
  await UserStats.create({
    userId: user._id,
  })

  // Initialize streak on first registration
  user.updateStreak()
  await user.save()

  generateToken(res, user._id)

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    streak: user.streak.current,
    longestStreak: user.streak.longest,
  })
})

// @desc logout user
// route /api/users/logout
// @method post
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  })
  res.status(200).json({ message: "User logged out" })
})

// @desc get user profile
// route /api/users/profile
// @method get
const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user.id,
    name: req.user.name,
    email: req.user.email,
  }
  res.status(200).json(user)
})

// @desc update user profile
// route /api/users/profile
// @method put
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email

    if (req.body.password) {
      user.password = req.body.password
    }

    const updatedUser = await user.save()

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    })
  } else {
    res.status(404)
    throw new Error("User not found")
  }
})

// @desc get user stats
// route /api/users/stats
// @method get
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await UserStats.findOne({ userId: req.user._id })

  if (!stats) {
    res.status(404)
    throw new Error("Stats not found")
  }

  res.status(200).json(stats)
})

// @desc get user streak
// route /api/users/streak
// @method get
const getUserStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  res.status(200).json({
    current: user.streak.current,
    longest: user.streak.longest,
    lastLoginDate: user.streak.lastLoginDate,
  })
})

export { authUser, registerUser, logoutUser, getUserProfile, updateUserProfile, getUserStats, getUserStreak }
