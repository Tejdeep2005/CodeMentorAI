import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

const DSA_SYSTEM_PROMPT = `You are an expert DSA (Data Structures and Algorithms) tutor and mentor. Your role is to help students understand and solve DSA problems effectively.

Guidelines:
1. Explain concepts clearly with examples when needed
2. For problem-solving questions, guide the student through the approach rather than just giving the solution
3. Provide time and space complexity analysis
4. Suggest optimal approaches and trade-offs
5. Help debug code if provided
6. Recommend related problems for practice
7. Explain why certain data structures are better for specific problems
8. Be encouraging and supportive
9. If asked about a specific problem, provide hints first, then full solution if needed
10. Cover topics like: Arrays, Strings, Linked Lists, Stacks, Queues, Trees, Graphs, Dynamic Programming, Sorting, Searching, Hashing, Greedy, Backtracking, Bit Manipulation, etc.

Always maintain context from previous messages in the conversation to provide personalized guidance.`

export const generateChatResponse = async (userMessage, conversationHistory = []) => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured")
    }

    // Format conversation history for OpenAI API
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ]

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: DSA_SYSTEM_PROMPT,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 30000,
      }
    )

    if (response.data.choices && response.data.choices.length > 0) {
      const assistantMessage = response.data.choices[0].message.content
      return {
        success: true,
        message: assistantMessage,
      }
    } else {
      throw new Error("No response from OpenAI API")
    }
  } catch (error) {
    console.error("Chatbot Service Error:", error.response?.status, error.message)
    
    let errorMessage = "Sorry, I encountered an error processing your question. Please try again."
    
    if (error.response?.status === 429) {
      errorMessage = "Rate limit exceeded. Please wait a moment and try again."
    } else if (error.response?.status === 401) {
      errorMessage = "API key is invalid. Please check your OpenAI API key."
    } else if (error.response?.status === 403) {
      errorMessage = "Access denied. Please check your OpenAI account and billing."
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error.message,
    }
  }
}

export const generateQuickTip = async (topic) => {
  try {
    const tipPrompt = `Provide a quick, concise tip (2-3 sentences) for understanding or solving ${topic} problems in DSA. Focus on the key insight or common mistake to avoid.`

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: DSA_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: tipPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 256,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 15000,
      }
    )

    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content
    }
    return null
  } catch (error) {
    console.error("Quick Tip Generation Error:", error.message)
    return null
  }
}
