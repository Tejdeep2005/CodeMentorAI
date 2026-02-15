import asyncHandler from "express-async-handler"
import axios from "axios"

// @desc execute code
// @route /api/code-editor/execute
// @method post
const executeCode = asyncHandler(async (req, res) => {
  try {
    const { code, language, input } = req.body

    if (!code || !language) {
      res.status(400)
      throw new Error("Code and language are required")
    }

    // Use Judge0 API for code execution
    const result = await executeWithJudge0(code, language, input)

    res.status(200).json({
      success: true,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
    })
  } catch (error) {
    console.error("Code execution error:", error.message)
    res.status(500).json({
      success: false,
      error: error.message || "Code execution failed",
    })
  }
})

// @desc get AI assistance for code
// @route /api/code-editor/assist
// @method post
const getCodeAssistance = asyncHandler(async (req, res) => {
  try {
    const { code, language, error, question } = req.body

    if (!code || !language) {
      res.status(400)
      throw new Error("Code and language are required")
    }

    // Get AI assistance using Claude API or similar
    const assistance = await getAIAssistance(code, language, error, question)

    res.status(200).json({
      success: true,
      assistance,
    })
  } catch (error) {
    console.error("AI assistance error:", error.message)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get assistance",
    })
  }
})

// Execute code using Judge0 API
const executeWithJudge0 = async (code, language, input) => {
  try {
    const languageMap = {
      python: 71,
      python3: 71,
      java: 62,
      cpp: 54,
      c: 50,
      javascript: 63,
    }

    const languageId = languageMap[language.toLowerCase()]
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`)
    }

    // Submit code to Judge0
    const submitResponse = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions",
      {
        source_code: code,
        language_id: languageId,
        stdin: input || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    )

    const token = submitResponse.data.token

    // Poll for result
    let result = null
    let attempts = 0
    const maxAttempts = 20

    while (attempts < maxAttempts) {
      const resultResponse = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      )

      if (resultResponse.data.status.id > 2) {
        result = resultResponse.data
        break
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
      attempts++
    }

    if (!result) {
      throw new Error("Code execution timeout")
    }

    return {
      output: result.stdout || "",
      error: result.stderr || result.compile_output || "",
      executionTime: result.time || 0,
      memoryUsed: result.memory || 0,
    }
  } catch (error) {
    console.error("Judge0 execution error:", error.message)
    return {
      output: "",
      error: error.message || "Execution failed",
      executionTime: 0,
      memoryUsed: 0,
    }
  }
}

// Get AI assistance for code
const getAIAssistance = async (code, language, error, question) => {
  try {
    const prompt = error
      ? `The user has a ${language} code with an error. Help them fix it:\n\nCode:\n${code}\n\nError:\n${error}\n\nProvide a clear explanation of what's wrong and how to fix it.`
      : `The user is asking about this ${language} code:\n\nCode:\n${code}\n\nQuestion:\n${question}\n\nProvide a helpful explanation.`

    // Mock AI response - in production, use Claude API or similar
    const assistance = generateMockAssistance(code, language, error, question)

    return assistance
  } catch (error) {
    console.error("AI assistance error:", error.message)
    throw error
  }
}

// Generate mock AI assistance
const generateMockAssistance = (code, language, error, question) => {
  if (error) {
    return {
      type: "error_fix",
      title: "Code Error Analysis",
      explanation: `I detected an issue in your ${language} code. Common issues in ${language}:\n\n1. Syntax errors - Check brackets, semicolons, and indentation\n2. Logic errors - Verify your algorithm logic\n3. Runtime errors - Check for null references or out-of-bounds access\n\nTips:\n- Use print/console.log statements to debug\n- Check variable types and conversions\n- Verify loop conditions\n- Test with sample inputs`,
      suggestion: `Try adding debug statements to trace the execution flow. Also, ensure all variables are properly initialized before use.`,
    }
  }

  return {
    type: "code_explanation",
    title: "Code Explanation",
    explanation: `Your ${language} code appears to be solving a problem. Here's what I see:\n\n1. Code structure looks organized\n2. Variable naming is clear\n3. Logic flow is understandable\n\nSuggestions for improvement:\n- Add comments to explain complex logic\n- Consider edge cases\n- Optimize for better time/space complexity\n- Add error handling`,
    suggestion: `Consider refactoring for readability and adding comprehensive comments.`,
  }
}

export { executeCode, getCodeAssistance }
