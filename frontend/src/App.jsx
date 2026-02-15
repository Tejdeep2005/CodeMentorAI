import React from 'react'
import Routings from './PageRouting/Routings'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import ChatBotButton from './components/ChatBotButton'

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Routings />
        <ChatBotButton />
      </UserProvider>
    </ThemeProvider>
  )
}

export default App