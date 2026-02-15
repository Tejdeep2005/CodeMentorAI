import asyncHandler from "express-async-handler"
import axios from "axios"
import UserStats from "../models/userStatsModel.js"

// Interview questions database for different roles
const interviewQuestions = {
  frontend: [
    "What is the difference between let, const, and var in JavaScript?",
    "Explain the concept of closures in JavaScript.",
    "What is the virtual DOM and how does React use it?",
    "How do you handle state management in React applications?",
    "Explain the difference between controlled and uncontrolled components.",
    "What are React hooks and why are they useful?",
    "How does CSS flexbox work?",
    "What is the difference between async/await and promises?",
    "Explain event delegation in JavaScript.",
    "What is the purpose of the useEffect hook?",
  ],
  backend: [
    "What is REST API and how does it work?",
    "Explain the difference between SQL and NoSQL databases.",
    "What is middleware in Express.js?",
    "How do you handle authentication and authorization?",
    "Explain the concept of microservices.",
    "What is caching and why is it important?",
    "How do you optimize database queries?",
    "What is the difference between synchronous and asynchronous programming?",
    "Explain the concept of API rate limiting.",
    "What is a transaction in databases?",
  ],
  fullstack: [
    "Describe the full lifecycle of a web request.",
    "How do you secure a web application?",
    "What is the difference between authentication and authorization?",
    "Explain the MVC architecture pattern.",
    "How do you handle errors in a full-stack application?",
    "What is the purpose of environment variables?",
    "How do you optimize application performance?",
    "Explain the concept of CI/CD pipelines.",
    "What is Docker and why is it useful?",
    "How do you handle database migrations?",
  ],
  devops: [
    "What is containerization and why is Docker important?",
    "Explain the difference between CI and CD.",
    "What is Kubernetes and what problems does it solve?",
    "How do you monitor and log applications?",
    "Explain infrastructure as code (IaC).",
    "What is load balancing and why is it needed?",
    "How do you handle secrets management?",
    "Explain the concept of blue-green deployment.",
    "What is a reverse proxy and what is its purpose?",
    "How do you scale applications horizontally and vertically?",
  ],
  datascience: [
    "What is the difference between supervised and unsupervised learning?",
    "Explain the concept of overfitting and how to prevent it.",
    "What is cross-validation and why is it important?",
    "Explain the difference between classification and regression.",
    "What is feature engineering and why is it important?",
    "How do you handle missing data in datasets?",
    "Explain the concept of bias-variance tradeoff.",
    "What is the purpose of normalization and standardization?",
    "How do you evaluate a machine learning model?",
    "Explain the concept of ensemble methods.",
  ],
}

// @desc get interview questions for a role
// route /api/interview/questions
// @method get
const getInterviewQuestions = asyncHandler(async (req, res) => {
  const { role = "frontend", count = 5 } = req.query

  if (!interviewQuestions[role]) {
    res.status(400)
    throw new Error(`Role '${role}' not found. Available roles: ${Object.keys(interviewQuestions).join(", ")}`)
  }

  // Shuffle and get random questions
  const questions = interviewQuestions[role]
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  const selectedQuestions = shuffled.slice(0, Math.min(count, questions.length))

  res.status(200).json({
    role,
    questions: selectedQuestions,
    totalQuestions: selectedQuestions.length,
  })
})

// @desc evaluate interview response using Gemini AI
// route /api/interview/evaluate
// @method post
const evaluateResponse = asyncHandler(async (req, res) => {
  const { question, answer, role } = req.body

  if (!question || !answer) {
    res.status(400)
    throw new Error("Question and answer are required")
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY
    
    if (!geminiApiKey) {
      // Fallback evaluation without API
      const fallbackScore = evaluateFallback(question, answer)
      return res.status(200).json({
        score: fallbackScore.score,
        feedback: fallbackScore.feedback,
        strengths: fallbackScore.strengths,
        improvements: fallbackScore.improvements,
        usingFallback: true,
      })
    }

    const prompt = `You are an expert technical interviewer. Evaluate the following interview response.

Question: ${question}
Role: ${role || "General"}
Candidate's Answer: ${answer}

Provide evaluation in this exact JSON format:
{
  "score": <number 0-100>,
  "feedback": "<brief overall feedback>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}

Be fair but critical. Consider technical accuracy, clarity, depth, and relevance.`

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    )

    const responseText = response.data.candidates[0].content.parts[0].text
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Could not parse evaluation response")
    }

    const evaluation = JSON.parse(jsonMatch[0])

    res.status(200).json({
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      usingFallback: false,
    })
  } catch (error) {
    console.error("Error evaluating response:", error.message)
    
    // Fallback evaluation
    const fallbackScore = evaluateFallback(question, answer)
    res.status(200).json({
      score: fallbackScore.score,
      feedback: fallbackScore.feedback,
      strengths: fallbackScore.strengths,
      improvements: fallbackScore.improvements,
      usingFallback: true,
    })
  }
})

// Fallback evaluation function (no API needed)
const evaluateFallback = (question, answer) => {
  const answerLength = answer.trim().split(" ").length
  const answerLower = answer.toLowerCase()
  
  let score = 50 // Base score
  let strengths = []
  let improvements = []

  // Length evaluation
  if (answerLength < 10) {
    score -= 20
    improvements.push("Answer is too brief. Provide more detailed explanation.")
  } else if (answerLength > 100) {
    strengths.push("Comprehensive answer with good detail.")
    score += 15
  } else {
    strengths.push("Good answer length.")
    score += 5
  }

  // Technical keywords
  const technicalKeywords = [
    "algorithm", "complexity", "optimization", "performance", "architecture",
    "design pattern", "best practice", "scalability", "security", "testing",
    "documentation", "maintainability", "efficiency", "framework", "library"
  ]
  
  const keywordCount = technicalKeywords.filter(kw => answerLower.includes(kw)).length
  if (keywordCount >= 3) {
    strengths.push("Good use of technical terminology.")
    score += 15
  } else if (keywordCount === 0) {
    improvements.push("Include more technical terminology and concepts.")
    score -= 10
  }

  // Structure evaluation
  if (answerLower.includes("first") || answerLower.includes("example") || answerLower.includes("because")) {
    strengths.push("Well-structured answer with clear reasoning.")
    score += 10
  } else {
    improvements.push("Structure your answer better with clear reasoning.")
    score -= 5
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score))

  const feedback = score >= 75 ? "Excellent response!" : 
                   score >= 60 ? "Good answer with room for improvement." :
                   score >= 45 ? "Average response. Try to be more specific." :
                   "Needs improvement. Provide more technical depth."

  if (improvements.length === 0) {
    improvements.push("Continue practicing to refine your answers.")
  }

  return {
    score,
    feedback,
    strengths: strengths.length > 0 ? strengths : ["Answer provided"],
    improvements,
  }
}

// @desc save interview result
// route /api/interview/save-result
// @method post
const saveInterviewResult = asyncHandler(async (req, res) => {
  const { role, score, totalQuestions, answers } = req.body

  if (!role || score === undefined) {
    res.status(400)
    throw new Error("Role and score are required")
  }

  try {
    let userStats = await UserStats.findOne({ userId: req.user._id })

    if (!userStats) {
      userStats = await UserStats.create({
        userId: req.user._id,
        interviewsGiven: 1,
        lastInterviewScore: score,
      })
    } else {
      userStats.interviewsGiven = (userStats.interviewsGiven || 0) + 1
      userStats.lastInterviewScore = score
      await userStats.save()
    }

    res.status(200).json({
      message: "Interview result saved successfully",
      stats: {
        interviewsGiven: userStats.interviewsGiven,
        lastInterviewScore: userStats.lastInterviewScore,
      },
    })
  } catch (error) {
    console.error("Error saving interview result:", error)
    res.status(500)
    throw new Error("Failed to save interview result")
  }
})

// @desc get available roles
// route /api/interview/roles
// @method get
const getAvailableRoles = asyncHandler(async (req, res) => {
  const roles = Object.keys(interviewQuestions).map(role => ({
    id: role,
    name: role.charAt(0).toUpperCase() + role.slice(1).replace(/([A-Z])/g, " $1"),
    questionCount: interviewQuestions[role].length,
  }))

  res.status(200).json({
    roles,
    totalRoles: roles.length,
  })
})

export { getInterviewQuestions, evaluateResponse, saveInterviewResult, getAvailableRoles }
