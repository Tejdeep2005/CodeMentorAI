import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import { Play, Copy, Download, Trash2, MessageCircle, X } from "lucide-react";
import Editor from "@monaco-editor/react";

const CodeEditor = () => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState("# Write your code here\n");
  const [language, setLanguage] = useState("python");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);

  // Load Noupe chatbot script when showChat is true
  useEffect(() => {
    if (showChat) {
      // Remove any existing Noupe script
      const existingScripts = document.querySelectorAll('script[src*="noupe.com"]');
      existingScripts.forEach(script => script.remove());

      // Add delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const script = document.createElement("script");
        script.src = "https://www.noupe.com/embed/019c5fc4cfac7578b7dbb55a4fda9bfce510.js";
        script.async = true;
        script.onload = () => {
          console.log("Noupe chatbot script loaded");
        };
        script.onerror = () => {
          console.error("Failed to load Noupe chatbot script");
        };
        document.body.appendChild(script);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [showChat]);

  const languages = [
    { value: "python", label: "Python 3", apiValue: "python3" },
    { value: "java", label: "Java", apiValue: "java" },
    { value: "cpp", label: "C++", apiValue: "cpp" },
    { value: "c", label: "C", apiValue: "c" },
    { value: "javascript", label: "JavaScript", apiValue: "javascript" },
  ];

  const languageTemplates = {
    python: "# Python 3\ndef main():\n    print('Hello, World!')\n\nif __name__ == '__main__':\n    main()",
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
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    try {
      const langObj = languages.find(l => l.value === language);
      const apiLanguage = langObj?.apiValue || language;

      const res = await axios.post(
        `${apiUrl}/api/code-editor/execute`,
        {
          code,
          language: apiLanguage,
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
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    try {
      const langObj = languages.find(l => l.value === language);
      const apiLanguage = langObj?.apiValue || language;

      const res = await axios.post(
        `${apiUrl}/api/code-editor/assist`,
        {
          code,
          language: apiLanguage,
          error: error || undefined,
          question: "Explain this code",
        },
        { withCredentials: true }
      );
      console.log("Assistance received:", res.data);
    } catch (err) {
      console.error("Failed to get assistance:", err);
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
    const ext = language === "python" ? "py" : language === "java" ? "java" : language === "cpp" ? "cpp" : language === "c" ? "c" : "js";
    element.download = `code.${ext}`;
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

            {/* Monaco Code Editor */}
            <div className="h-96">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || "")}
                theme={isDarkMode ? "vs-dark" : "vs-light"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                  automaticLayout: true,
                  tabSize: 4,
                  insertSpaces: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  autoIndent: "full",
                  bracketPairColorization: {
                    enabled: true,
                  },
                  "bracketPairColorization.independentColorPoolPerBracketType": true,
                }}
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

            {/* Noupe AI Chat */}
            {showChat && (
              <div className={`rounded-lg shadow-lg border-2 ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className={`p-4 border-b font-semibold flex justify-between items-center ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                  <span>🤖 AI Assistant</span>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 hover:bg-gray-300 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className={`p-4 min-h-96 flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                  <div className="text-center">
                    <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      AI Assistant is loading...
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                      The chatbot will appear as a floating widget on the page
                    </p>
                  </div>
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
