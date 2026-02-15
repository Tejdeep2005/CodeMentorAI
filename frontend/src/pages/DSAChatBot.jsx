import React, { useEffect } from "react"

const DSAChatBotPage = () => {
  useEffect(() => {
    // Load Noupe chatbot script
    const script = document.createElement("script")
    script.src = "https://www.noupe.com/embed/019c5fc4cfac7578b7dbb55a4fda9bfce510.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">DSA Chatbot</h1>
        <p className="text-gray-600 mb-8">Ask any DSA-related questions below</p>
        <div id="noupe-chatbot" className="w-full h-full" />
      </div>
    </div>
  )
}

export default DSAChatBotPage
