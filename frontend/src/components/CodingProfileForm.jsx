import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CodingProfileForm() {
  const [leetcodeId, setLeetcodeId] = useState("");
  const [hackerrankId, setHackerrankId] = useState("");
  const [hackerrankSolved, setHackerrankSolved] = useState("");
  const [codechefId, setCodechefId] = useState("");
  const [geeksforgeeksId, setGeeksforgeeksId] = useState("");
  const [geeksforgeeksSolved, setGeeksforgeeksSolved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/coding-profile", {
        withCredentials: true,
      });
      setLeetcodeId(response.data.leetcodeId || "");
      setHackerrankId(response.data.hackerrankId || "");
      setHackerrankSolved(response.data.hackerrankStats?.solved || "");
      setCodechefId(response.data.codechefId || "");
      setGeeksforgeeksId(response.data.geeksforgeeksId || "");
      setGeeksforgeeksSolved(response.data.geeksforgeeksStats?.solved || "");
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await axios.put(
        "http://localhost:3000/api/coding-profile",
        {
          leetcodeId,
          hackerrankId,
          hackerrankSolved: hackerrankSolved ? parseInt(hackerrankSolved) : 0,
          codechefId,
          geeksforgeeksId,
          geeksforgeeksSolved: geeksforgeeksSolved ? parseInt(geeksforgeeksSolved) : 0,
        },
        {
          withCredentials: true,
        }
      );
      setMessage("✅ Profile updated and stats fetched successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("❌ Failed to update profile. Please check the usernames.");
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setSaving(true);
    setMessage("");

    try {
      await axios.post(
        "http://localhost:3000/api/coding-profile/refresh",
        {},
        {
          withCredentials: true,
        }
      );
      setMessage("✅ Stats refreshed successfully!");
      setTimeout(() => {
        setMessage("");
        fetchProfile();
      }, 2000);
    } catch (error) {
      setMessage("❌ Failed to refresh stats");
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Coding Platform IDs</CardTitle>
        <CardDescription>
          Connect your coding platform accounts to track your progress and get personalized recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LeetCode */}
          <div className="space-y-2">
            <Label htmlFor="leetcode">LeetCode Username</Label>
            <div className="flex gap-2">
              <Input
                id="leetcode"
                placeholder="e.g., john_doe"
                value={leetcodeId}
                onChange={(e) => setLeetcodeId(e.target.value)}
                className="flex-1"
              />
              {leetcodeId && (
                <a
                  href={`https://leetcode.com/${leetcodeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  View Profile
                </a>
              )}
            </div>
          </div>

          {/* HackerRank */}
          <div className="space-y-2">
            <Label htmlFor="hackerrank">HackerRank Username</Label>
            <p className="text-xs text-gray-500 mb-2">
              ℹ️ HackerRank doesn't expose solved problems publicly. Please enter your solved count manually below.
            </p>
            <div className="flex gap-2">
              <Input
                id="hackerrank"
                placeholder="e.g., john_doe"
                value={hackerrankId}
                onChange={(e) => setHackerrankId(e.target.value)}
                className="flex-1"
              />
              {hackerrankId && (
                <a
                  href={`https://www.hackerrank.com/${hackerrankId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  View Profile
                </a>
              )}
            </div>
            {hackerrankId && (
              <div className="mt-2">
                <Label htmlFor="hackerrank-solved" className="text-sm">
                  Problems Solved (Manual Entry)
                </Label>
                <Input
                  id="hackerrank-solved"
                  type="number"
                  placeholder="e.g., 150"
                  value={hackerrankSolved}
                  onChange={(e) => setHackerrankSolved(e.target.value)}
                  className="mt-1"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Visit your HackerRank profile and check the "Solved" section to find this number
                </p>
              </div>
            )}
          </div>

          {/* CodeChef */}
          <div className="space-y-2">
            <Label htmlFor="codechef">CodeChef Username</Label>
            <div className="flex gap-2">
              <Input
                id="codechef"
                placeholder="e.g., john_doe"
                value={codechefId}
                onChange={(e) => setCodechefId(e.target.value)}
                className="flex-1"
              />
              {codechefId && (
                <a
                  href={`https://www.codechef.com/users/${codechefId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  View Profile
                </a>
              )}
            </div>
          </div>

          {/* GeeksforGeeks */}
          <div className="space-y-2">
            <Label htmlFor="geeksforgeeks">GeeksforGeeks Username</Label>
            <p className="text-xs text-gray-500 mb-2">
              ℹ️ GeeksforGeeks API may not be publicly available. Please enter your solved count manually below.
            </p>
            <div className="flex gap-2">
              <Input
                id="geeksforgeeks"
                placeholder="e.g., john_doe"
                value={geeksforgeeksId}
                onChange={(e) => setGeeksforgeeksId(e.target.value)}
                className="flex-1"
              />
              {geeksforgeeksId && (
                <a
                  href={`https://auth.geeksforgeeks.org/user/${geeksforgeeksId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm"
                >
                  View Profile
                </a>
              )}
            </div>
            {geeksforgeeksId && (
              <div className="mt-2">
                <Label htmlFor="geeksforgeeks-solved" className="text-sm">
                  Problems Solved (Manual Entry)
                </Label>
                <Input
                  id="geeksforgeeks-solved"
                  type="number"
                  placeholder="e.g., 20"
                  value={geeksforgeeksSolved}
                  onChange={(e) => setGeeksforgeeksSolved(e.target.value)}
                  className="mt-1"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Visit your GeeksforGeeks profile and check the problems solved count
                </p>
              </div>
            )}
          </div>

          {message && (
            <div className={`p-3 rounded ${message.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {message}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving..." : "Save Coding Profiles"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={saving}
            >
              {saving ? "Refreshing..." : "Refresh Stats"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
