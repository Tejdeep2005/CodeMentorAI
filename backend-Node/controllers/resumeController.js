import asyncHandler from "express-async-handler"
import axios from "axios"
import dotenv from "dotenv"
import fs from "fs"
import FormData from "form-data"
import UserStats from "../models/userStatsModel.js"

dotenv.config()

// @desc analyze resume using Python backend with Gemini AI
// route /analyze-resume
// @method post
const analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400)
    throw new Error("No file uploaded")
  }

  const jobDescription = req.body.job_description || ""

  try {
    console.log("Analyzing resume:", req.file.filename)
    
    // Create FormData with the file
    const form = new FormData()
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname)
    form.append("job_description", jobDescription)

    // Forward to Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
    console.log("Sending to Python backend:", pythonBackendUrl)
    
    const response = await axios.post(`${pythonBackendUrl}/analyze-resume/`, form, {
      headers: form.getHeaders(),
      timeout: 120000,
    })

    console.log("Resume analysis successful")

    // Extract resume score from analysis
    const analysisText = response.data.analysis
    let resumeScore = 0
    
    // Try to extract ATS score from the analysis
    const atsMatch = analysisText.match(/ATS Score[:\s]+(\d+)/i)
    if (atsMatch) {
      resumeScore = parseInt(atsMatch[1])
    } else {
      // Try to extract strength score
      const strengthMatch = analysisText.match(/Strength Score[:\s]+(\d+)/i)
      if (strengthMatch) {
        resumeScore = parseInt(strengthMatch[1])
      }
    }

    // Save resume score to UserStats
    let userStats = await UserStats.findOne({ userId: req.user._id })
    if (!userStats) {
      userStats = await UserStats.create({
        userId: req.user._id,
        resumeScore: resumeScore,
      })
    } else {
      userStats.resumeScore = resumeScore
      await userStats.save()
    }

    console.log(`Resume score saved: ${resumeScore}`)

    // Clean up uploaded file
    fs.unlinkSync(req.file.path)

    res.status(200).json({
      analysis: response.data.analysis,
      resumeScore: resumeScore,
    })
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    console.error("Error analyzing resume:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    
    res.status(500)
    throw new Error(
      `Failed to analyze resume. Make sure Python backend is running on port 8000. Error: ${error.message}`
    )
  }
})

export { analyzeResume }
