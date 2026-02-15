import React, { useEffect } from "react"

const ChatBotButton = () => {
  useEffect(() => {
    // Load Noupe chatbot script
    const script = document.createElement("script")
    script.src = "https://www.noupe.com/embed/019c5fc4cfac7578b7dbb55a4fda9bfce510.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return null
}

export default ChatBotButton
