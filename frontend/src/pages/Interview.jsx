import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";

export default function Interview() {
  const { user } = useUser();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [stage, setStage] = useState("role-selection"); // role-selection, interview, results
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setCurrentAnswer((prev) => prev + " " + transcript);
          } else {
            interimTranscript += transcript;
          }
        }
      };
    }
  }, []);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/interview/roles`, {
          withCredentials: true,
        });
        setRoles(response.data.roles);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchRoles();
  }, [apiUrl]);

  // Fetch questions for selected role
  const startInterview = async (role) => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/interview/questions`, {
        params: { role, count: 5 },
        withCredentials: true,
      });
      setQuestions(response.data.questions);
      setSelectedRole(role);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setEvaluations([]);
      setCurrentAnswer("");
      setStage("interview");
      
      // Speak the first question
      speakQuestion(response.data.questions[0]);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      alert("Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  // Text-to-speech for questions
  const speakQuestion = (question) => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  // Start listening for answer
  const startListening = () => {
    if (recognitionRef.current) {
      setCurrentAnswer("");
      recognitionRef.current.start();
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Evaluate current answer
  const evaluateAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert("Please provide an answer");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/interview/evaluate`,
        {
          question: questions[currentQuestionIndex],
          answer: currentAnswer,
          role: selectedRole,
        },
        { withCredentials: true }
      );

      setEvaluations([...evaluations, response.data]);
      setAnswers([...answers, currentAnswer]);

      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer("");
        setTimeout(() => {
          speakQuestion(questions[currentQuestionIndex + 1]);
        }, 1000);
      } else {
        // Interview finished
        finishInterview([...evaluations, response.data]);
      }
    } catch (error) {
      console.error("Failed to evaluate answer:", error);
      alert("Failed to evaluate answer");
    } finally {
      setLoading(false);
    }
  };

  // Finish interview and save results
  const finishInterview = async (allEvaluations) => {
    const avgScore = Math.round(
      allEvaluations.reduce((sum, e) => sum + e.score, 0) / allEvaluations.length
    );
    setOverallScore(avgScore);

    try {
      await axios.post(
        `${apiUrl}/api/interview/save-result`,
        {
          role: selectedRole,
          score: avgScore,
          totalQuestions: questions.length,
          answers,
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Failed to save interview result:", error);
    }

    setStage("results");
  };

  // Restart interview
  const restartInterview = () => {
    setStage("role-selection");
    setSelectedRole(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setEvaluations([]);
    setOverallScore(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎤 AI Interview</h1>
          <p className="text-gray-400">Practice interviews for different roles with AI evaluation</p>
        </div>

        {/* Role Selection Stage */}
        {stage === "role-selection" && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-purple-500">
              <h2 className="text-2xl font-semibold text-white mb-6">Select a Role</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => startInterview(role.id)}
                    disabled={loading}
                    className="bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white p-6 rounded-lg transition transform hover:scale-105 disabled:opacity-50"
                  >
                    <div className="text-2xl mb-2">
                      {role.id === "frontend" && "🎨"}
                      {role.id === "backend" && "⚙️"}
                      {role.id === "fullstack" && "🔗"}
                      {role.id === "devops" && "🚀"}
                      {role.id === "datascience" && "📊"}
                    </div>
                    <h3 className="font-semibold text-lg">{role.name}</h3>
                    <p className="text-sm text-purple-200">{role.questionCount} questions</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Interview Stage */}
        {stage === "interview" && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-gray-900 rounded-lg p-4 border border-purple-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-purple-400">{selectedRole.toUpperCase()}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-gray-900 rounded-lg p-8 border border-purple-500">
              <h2 className="text-2xl font-semibold text-white mb-6">
                {questions[currentQuestionIndex]}
              </h2>

              <button
                onClick={() => speakQuestion(questions[currentQuestionIndex])}
                disabled={isSpeaking}
                className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isSpeaking ? "🔊 Speaking..." : "🔊 Repeat Question"}
              </button>

              {/* Answer Input */}
              <div className="space-y-4">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here or use voice input..."
                  className="w-full h-32 bg-gray-800 text-white border border-gray-700 rounded-lg p-4 focus:border-purple-500 focus:outline-none"
                />

                {/* Voice Controls */}
                <div className="flex gap-4">
                  <button
                    onClick={startListening}
                    disabled={isListening || loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg disabled:opacity-50 font-semibold"
                  >
                    {isListening ? "🎤 Listening..." : "🎤 Start Speaking"}
                  </button>
                  <button
                    onClick={stopListening}
                    disabled={!isListening}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg disabled:opacity-50 font-semibold"
                  >
                    ⏹️ Stop
                  </button>
                </div>

                {/* Submit Answer */}
                <button
                  onClick={evaluateAnswer}
                  disabled={loading || !currentAnswer.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? "Evaluating..." : "✓ Submit Answer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Stage */}
        {stage === "results" && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-8 text-center border border-purple-400">
              <h2 className="text-3xl font-bold text-white mb-4">Interview Complete! 🎉</h2>
              <div className="text-6xl font-bold text-yellow-300 mb-2">{overallScore}%</div>
              <p className="text-purple-200 text-lg">
                {overallScore >= 80 ? "Excellent Performance!" :
                 overallScore >= 60 ? "Good Job! Keep Practicing." :
                 "Keep Improving! Practice More."}
              </p>
            </div>

            {/* Detailed Feedback */}
            <div className="space-y-4">
              {evaluations.map((evaluation, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-6 border border-purple-500">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white flex-1">
                      Q{index + 1}: {questions[index]}
                    </h3>
                    <div className="text-3xl font-bold text-purple-400">{evaluation.score}%</div>
                  </div>

                  <p className="text-gray-300 mb-4">{evaluation.feedback}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-green-400 font-semibold mb-2">✓ Strengths</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {evaluation.strengths.map((strength, i) => (
                          <li key={i}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-2">→ Improvements</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {evaluation.improvements.map((improvement, i) => (
                          <li key={i}>• {improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mt-4 italic">
                    Your Answer: {answers[index]}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={restartInterview}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                🔄 Try Another Role
              </button>
              <button
                onClick={() => navigate("/app")}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                📊 Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
