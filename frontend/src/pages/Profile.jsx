import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    // Validate passwords match if provided
    if (password && password !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      setSaving(false);
      return;
    }

    try {
      const updateData = {
        name,
        email,
      };

      if (password) {
        updateData.password = password;
      }

      await axios.put(
        `${apiUrl}/api/users/profile`,
        updateData,
        {
          withCredentials: true,
        }
      );

      setMessage("✅ Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`❌ Failed to update profile: ${error.response?.data?.message || error.message}`);
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading...</div>;
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode ? "bg-gray-900" : "bg-[#f9fafb]"
    }`}>
      <div className="max-w-2xl mx-auto">
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : ""}>User Profile</CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
              Update your profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Section */}
              <div className={`border-t pt-6 ${isDarkMode ? "border-gray-700" : ""}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : ""}`}>Change Password (Optional)</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded ${
                  message.includes("✅") 
                    ? isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                    : isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"
                }`}>
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
