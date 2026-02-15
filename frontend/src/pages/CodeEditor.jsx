import React, { useState } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import { Play, Send, Copy, Download, Trash2, MessageCircle } from "lucide-react";

const CodeEditor = () => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState("// Write your code here\n");
  const [language, setLanguage] = useState("python3");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);

  const languages = [
    { value: "python3", label: "Python 3" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "javascript", label: "JavaScript" },
  ];

  const languageTemplates = {
    python3: "# Python 3\ndef main():\n    print('Hello, World!')\n\nif __name__ == '__main__':\n    main()",
    java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, World!\" << endl;\n    return 0;\n}",
    c: "#include <stdio.h>\n\nint main() {\n    printf(\"Hello, World!\\n\");\n    return 0;\n}",
    javascript: "console.log('Hello, World!');",
  };

  const handleExecute = async () => {
    setLoading(true);
    setError("");
    setOutput("");
    const startTime = Date.now();

    try {
      const res = await axios.post(
        "http://localhost:3000/api/code-editor/execute",
        {
          code,
          language,
          input,
        },
        { withCredentials: true }
      );

      setExecutionTime(Date.now() - startTime);
      setOutput(res.data.output || "No output");
      if (res.data.error) {
        setError(res.data.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Execution failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGetAssistance = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/api/code-editor/assist",
        {
          code,
          language,
          error: error || undefined,
          question: chatInput || "Explain this code",
        },
        { withCredentials: true }
      );

      const assistance = res.data.assistance;
      setChatMessages([
        ...chatMessages,
        {
          type: "user",
          message: chatInput || "Explain this code",
        },
        {
          type: "ai",
          message: assistance.explanation,
          suggestion: assistance.suggestion,
        },
      ]);
      setChatInput("");
    } catch (err) {
      setChatMessages([
        ...chatMessages,
        {
          type: "error",
          message: "Failed to get assistance",
        },
      ]);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `code.${language === "python3" ? "py" : language === "java" ? "java" : language === "cpp" ? "cpp" : language === "c" ? "c" : "js"}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClearCode = () => {
    if (window.confirm("Clear all code?")) {
      setCode(languageTemplates[language]);
      setOutput("");
      setError("");
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(languageTemplates[newLanguage]);
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode ? "bg-gray-900" : "bg-gray-50"
    }`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          💻 Code Editor & AI Assistant
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Section */}
          <div className={`lg:col-span-2 rounded-lg overflow-hidden shadow-lg ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            {/* Language Selector */}
            <div className={`p-4 border-b ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Language:</span>
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      language === lang.value
                        ? "bg-purple-600 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Editor */}
            <div className={`p-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full h-96 p-4 font-mono text-sm rounded border-2 focus:outline-none focus:border-purple-500 ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-gray-100"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                }`}
                spellCheck="false"
              />
            </div>

            {/* Input Section */}
            <div className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Input (if needed):
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={`w-full h-20 p-3 font-mono text-sm rounded border-2 focus:outline-none focus:border-purple-500 ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-gray-100"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                }`}
                placeholder="Enter input here..."
              />
            </div>

            {/* Action Buttons */}
            <div className={`p-4 border-t flex flex-wrap gap-2 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {loading ? "Running..." : "Run Code"}
              </button>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleDownloadCode}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleClearCode}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Output & Chat Section */}
          <div className="space-y-4">
            {/* Output */}
            <div className={`rounded-lg shadow-lg overflow-hidden ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}>
              <div className={`p-4 border-b font-semibold ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                📤 Output
              </div>
              <div className={`p-4 h-40 overflow-y-auto font-mono text-sm ${
                isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
              }`}>
                {output || <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>No output yet</span>}
              </div>
              {executionTime > 0 && (
                <div className={`p-2 text-xs text-center ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  Execution time: {executionTime}ms
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={`rounded-lg shadow-lg overflow-hidden border-2 border-red-500 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}>
                <div className={`p-4 border-b font-semibold text-red-600 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                  ❌ Error
                </div>
                <div className={`p-4 h-20 overflow-y-auto font-mono text-sm text-red-600 ${
                  isDarkMode ? "bg-gray-900" : "bg-gray-50"
                }`}>
                  {error}
                </div>
              </div>
            )}

            {/* AI Chat Toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition"
            >
              <MessageCircle className="w-4 h-4" />
              {showChat ? "Hide" : "Show"} AI Assistant
            </button>

            {/* AI Chat */}
            {showChat && (
              <div className={`rounded-lg shadow-lg overflow-hidden ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}>
                <div className={`p-4 border-b font-semibold ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                  🤖 AI Assistant
                </div>
                <div className={`h-48 overflow-y-auto p-4 space-y-3 ${
                  isDarkMode ? "bg-gray-900" : "bg-gray-50"
                }`}>
                  {chatMessages.length === 0 ? (
                    <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      Ask me anything about your code!
                    </p>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`text-sm ${
                        msg.type === "user" ? "text-right" : msg.type === "error" ? "text-red-500" : "text-left"
                      }`}>
                        <div className={`inline-block max-w-xs p-2 rounded ${
                          msg.type === "user"
                            ? "bg-purple-600 text-white"
                            : msg.type === "error"
                            ? "bg-red-100 text-red-700"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-100"
                            : "bg-gray-200 text-gray-900"
                        }`}>
                          {msg.message}
                        </div>
                        {msg.suggestion && (
                          <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            💡 {msg.suggestion}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className={`p-3 border-t flex gap-2 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleGetAssistance()}
                    placeholder="Ask for help..."
                    className={`flex-1 px-3 py-2 text-sm rounded border focus:outline-none focus:border-purple-500 ${
                      isDarkMode
                        ? "bg-gray-900 border-gray-700 text-gray-100"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                  <button
                    onClick={handleGetAssistance}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
