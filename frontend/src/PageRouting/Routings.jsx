import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import Layout from './Layout'
import AnalyzeResume from '@/pages/AnalyzeResume'
import Interview from '@/pages/Interview'

import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import JobRecommendations from '@/pages/JobRecommendations'
import CodingProfiles from '@/pages/CodingProfiles'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import DSARoadmap from '@/pages/DSARoadmap'
import CodeEditor from '@/pages/CodeEditor'
import DSAChatBotPage from '@/pages/DSAChatBot'

function Routings() {
  return (
    <div>
        <Router>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/resume" element={<AnalyzeResume />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage/>} />
            <Route path="/app" element={<Layout />} >
                <Route index element={<Dashboard />} />
                <Route path="resume" element={<AnalyzeResume />} />
                <Route path="interview" element={<Interview />} />
                <Route path="job" element={<JobRecommendations />} />
                <Route path="coding-profiles" element={<CodingProfiles />} />
                <Route path="dsa-roadmap" element={<DSARoadmap />} />
                <Route path="code-editor" element={<CodeEditor />} />
                <Route path="dsa-chatbot" element={<DSAChatBotPage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
            </Route>
            </Routes>
        </Router>
    </div>
  )
}

export default Routings