import asyncHandler from "express-async-handler"
import ChatHistory from "../models/chatHistoryModel.js"
import { generateChatResponse, generateQuickTip } from "../services/chatbotService.js"

// @desc Send message to chatbot and get response
// route /api/chatbot/message
// @method post
const sendMessage = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body

  if (!message || message.trim() === "") {
    res.status(400)
    throw new Error("Message cannot be empty")
  }

  let chatHistory = null

  // Get or create chat history
  if (conversationId) {
    chatHistory = await ChatHistory.findById(conversationId)
    if (!chatHistory || chatHistory.userId.toString() !== req.user._id.toString()) {
      res.status(404)
      throw new Error("Conversation not found")
    }
  } else {
    chatHistory = await ChatHistory.create({
      userId: req.user._id,
      messages: [],
      topic: "General DSA",
    })
  }

  // Add user message to history
  chatHistory.messages.push({
    role: "user",
    content: message,
    timestamp: new Date(),
  })

  // Generate response from Gemini
  const conversationContext = chatHistory.messages.slice(-10).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))

  const aiResponse = await generateChatResponse(message, conversationContext.slice(0, -1))

  if (!aiResponse.success) {
    res.status(500)
    throw new Error(aiResponse.message)
  }

  // Add assistant response to history
  chatHistory.messages.push({
    role: "assistant",
    content: aiResponse.message,
    timestamp: new Date(),
  })

  await chatHistory.save()

  res.status(200).json({
    conversationId: chatHistory._id,
    userMessage: message,
    assistantMessage: aiResponse.message,
    messageCount: chatHistory.messages.length,
  })
})

// @desc Get chat history
// route /api/chatbot/history/:conversationId
// @method get
const getChatHistory = asyncHandler(async (req, res) => {
  const { conversationId } = req.params

  const chatHistory = await ChatHistory.findById(conversationId)

  if (!chatHistory || chatHistory.userId.toString() !== req.user._id.toString()) {
    res.status(404)
    throw new Error("Conversation not found")
  }

  res.status(200).json(chatHistory)
})

// @desc Get all conversations for user
// route /api/chatbot/conversations
// @method get
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await ChatHistory.find({ userId: req.user._id })
    .select("_id topic createdAt updatedAt messages")
    .sort({ updatedAt: -1 })
    .limit(20)

  const formattedConversations = conversations.map((conv) => ({
    _id: conv._id,
    topic: conv.topic,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messageCount: conv.messages.length,
    lastMessage: conv.messages[conv.messages.length - 1]?.content || "",
  }))

  res.status(200).json(formattedConversations)
})

// @desc Clear chat history
// route /api/chatbot/clear/:conversationId
// @method delete
const clearConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params

  const chatHistory = await ChatHistory.findById(conversationId)

  if (!chatHistory || chatHistory.userId.toString() !== req.user._id.toString()) {
    res.status(404)
    throw new Error("Conversation not found")
  }

  await ChatHistory.findByIdAndDelete(conversationId)

  res.status(200).json({ message: "Conversation cleared successfully" })
})

// @desc Get quick tip for a topic
// route /api/chatbot/tip
// @method post
const getQuickTip = asyncHandler(async (req, res) => {
  const { topic } = req.body

  if (!topic || topic.trim() === "") {
    res.status(400)
    throw new Error("Topic cannot be empty")
  }

  const tip = await generateQuickTip(topic)

  if (!tip) {
    res.status(500)
    throw new Error("Failed to generate tip")
  }

  res.status(200).json({ topic, tip })
})

// @desc Start new conversation
// route /api/chatbot/new
// @method post
const startNewConversation = asyncHandler(async (req, res) => {
  const { topic = "General DSA" } = req.body

  const chatHistory = await ChatHistory.create({
    userId: req.user._id,
    messages: [],
    topic,
  })

  res.status(201).json({
    conversationId: chatHistory._id,
    topic: chatHistory.topic,
    message: "New conversation started",
  })
})

export {
  sendMessage,
  getChatHistory,
  getConversations,
  clearConversation,
  getQuickTip,
  startNewConversation,
}
