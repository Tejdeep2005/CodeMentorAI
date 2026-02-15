import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode ? "bg-gray-900" : "bg-[#f9fafb]"
    }`}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* General Settings */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : ""}>General Settings</CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
              Manage your application preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${isDarkMode ? "text-white" : ""}`}>Email Notifications</h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Receive updates about your progress</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${isDarkMode ? "text-white" : ""}`}>Dark Mode</h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Use dark theme for the application</p>
              </div>
              <input 
                type="checkbox" 
                checked={isDarkMode}
                onChange={toggleDarkMode}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : ""}>Privacy & Security</CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
              Control your privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${isDarkMode ? "text-white" : ""}`}>Public Profile</h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Allow others to view your profile</p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${isDarkMode ? "text-white" : ""}`}>Show Statistics</h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Display your coding statistics publicly</p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : ""}>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <strong>Application:</strong> CodeMentor AI
              </p>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <strong>Version:</strong> 1.0.0
              </p>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <strong>Last Updated:</strong> February 2026
              </p>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className={`w-full ${isDarkMode ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600" : ""}`}>
                Privacy Policy
              </Button>
              <Button variant="outline" className={`w-full ${isDarkMode ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600" : ""}`}>
                Terms of Service
              </Button>
              <Button variant="outline" className={`w-full ${isDarkMode ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600" : ""}`}>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
