import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DailyRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/coding-profile/recommendations",
        {
          withCredentials: true,
        }
      );
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading recommendations...</div>;
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500 bg-red-50";
      case "medium":
        return "border-l-4 border-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-4 border-green-500 bg-green-50";
      default:
        return "border-l-4 border-gray-500 bg-gray-50";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-200 text-red-800";
      case "medium":
        return "bg-yellow-200 text-yellow-800";
      case "low":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>📋 Daily Recommendations</CardTitle>
        <CardDescription>
          Personalized suggestions based on your coding platform progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No recommendations yet. Add your coding platform IDs to get started!
            </p>
          ) : (
            recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{rec.platform}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(rec.priority)}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{rec.message}</p>
                    <p className="text-sm font-medium text-gray-600">
                      💡 {rec.action}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Button
          onClick={fetchRecommendations}
          variant="outline"
          className="w-full mt-4"
        >
          Refresh Recommendations
        </Button>
      </CardContent>
    </Card>
  );
}
