import React, { useEffect } from "react"

const DSAChatBotPage = () => {
  useEffect(() => {
    // Load Noupe chatbot script
    const script = document.createElement("script")
    script.src = "https://www.noupe.com/embed/019c5fc4cfac7578b7dbb55a4fda9bfce510.js"
    script.async = true
    script.onload = () => {
      console.log("Noupe chatbot script loaded successfully")
    }
    script.onerror = () => {
      console.error("Failed to load Noupe chatbot script")
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup
      const scripts = document.querySelectorAll('script[src*="noupe.com"]')
      scripts.forEach(s => {
        if (document.body.contains(s)) {
          document.body.removeChild(s)
        }
      })
    }
  }, [])

  return (
    <div className="w-full min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          🤖 DSA ChatBot
        </h1>
        <p className="text-gray-300 mb-8">
          Ask any Data Structures and Algorithms related questions. Our AI chatbot is here to help you understand and solve DSA problems.
        </p>
        
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 min-h-96">
          <div id="noupe-chatbot" className="w-full h-full">
            <p className="text-gray-400">Loading chatbot...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DSAChatBotPage
