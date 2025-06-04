"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Heart, Zap, Target, Calendar, AlertTriangle, Brain, Clock, TrendingUp } from "lucide-react"

interface ConversationInsightsProps {
  insights: {
    emotionalTrends: Array<{ emotion: string; frequency: number }>
    personalContext: {
      goals: string[]
      challenges: string[]
      preferences: string[]
      relationships: string[]
      futureEvents: Array<{ event: string; date: string; importance: number }>
      topics: Array<{ topic: string; frequency: number; sentiment: string; lastDiscussed: Date }>
    }
    hardwareOptimization: {
      preferredStates: Record<string, any>
      adaptationHistory: Array<{ emotion: string; optimization: any; effectiveness: number }>
    }
    disconnectionPoints: Array<{ topic: string; context: string; timestamp: Date }>
    memoryStats: {
      totalMemories: number
      recentMemories: number
      topTopics: Array<{ topic: string; frequency: number }>
    }
  }
  currentHardwareState: {
    cpuFrequency: number
    memoryUsage: number
    processingSpeed: number
    emotionalLoad: number
  }
}

export function ConversationInsights({ insights, currentHardwareState }: ConversationInsightsProps) {
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: "bg-yellow-500",
      sad: "bg-blue-500",
      angry: "bg-red-500",
      fearful: "bg-purple-500",
      surprised: "bg-green-500",
      disgusted: "bg-gray-500",
      content: "bg-emerald-500",
    }
    return colors[emotion] || "bg-gray-400"
  }

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      happy: "text-green-600",
      sad: "text-blue-600",
      angry: "text-red-600",
      fearful: "text-purple-600",
      surprised: "text-yellow-600",
      disgusted: "text-gray-600",
      content: "text-emerald-600",
    }
    return colors[sentiment] || "text-gray-500"
  }

  return (
    <div className="space-y-4">
      {/* Memory Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Memory System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{insights.memoryStats.totalMemories}</p>
              <p className="text-sm text-gray-600">Total Memories</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{insights.memoryStats.recentMemories}</p>
              <p className="text-sm text-gray-600">Recent (7 days)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{insights.memoryStats.topTopics.length}</p>
              <p className="text-sm text-gray-600">Active Topics</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Hardware State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Current AI Hardware State
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>CPU Frequency</span>
              <span>{(currentHardwareState.cpuFrequency * 100).toFixed(0)}%</span>
            </div>
            <Progress value={currentHardwareState.cpuFrequency * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Memory Usage</span>
              <span>{(currentHardwareState.memoryUsage * 100).toFixed(0)}%</span>
            </div>
            <Progress value={currentHardwareState.memoryUsage * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing Speed</span>
              <span>{(currentHardwareState.processingSpeed * 100).toFixed(0)}%</span>
            </div>
            <Progress value={currentHardwareState.processingSpeed * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Emotional Load</span>
              <span>{(currentHardwareState.emotionalLoad * 100).toFixed(0)}%</span>
            </div>
            <Progress value={currentHardwareState.emotionalLoad * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Emotional Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Emotional Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.emotionalTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getEmotionColor(trend.emotion)}`} />
                  <span className="capitalize">{trend.emotion}</span>
                </div>
                <Badge variant="secondary">{trend.frequency}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Discussion Topics */}
      {insights.memoryStats.topTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Discussion Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.memoryStats.topTopics.slice(0, 8).map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{topic.topic}</span>
                  <Badge variant="outline">{topic.frequency}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Topics with Sentiment */}
      {insights.personalContext.topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Topics & Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.personalContext.topics.slice(0, 6).map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm capitalize">{topic.topic}</span>
                    <span className={`text-xs ${getSentimentColor(topic.sentiment)}`}>{topic.sentiment}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {topic.frequency}
                    </Badge>
                    <span className="text-xs text-gray-500">{new Date(topic.lastDiscussed).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Personal Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.personalContext.goals.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Goals</h4>
              <div className="flex flex-wrap gap-1">
                {insights.personalContext.goals.slice(0, 5).map((goal, index) => (
                  <Badge key={index} variant="outline">
                    {goal.length > 30 ? goal.substring(0, 30) + "..." : goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {insights.personalContext.challenges.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Challenges</h4>
              <div className="flex flex-wrap gap-1">
                {insights.personalContext.challenges.slice(0, 5).map((challenge, index) => (
                  <Badge key={index} variant="destructive">
                    {challenge.length > 30 ? challenge.substring(0, 30) + "..." : challenge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {insights.personalContext.preferences.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Preferences</h4>
              <div className="flex flex-wrap gap-1">
                {insights.personalContext.preferences.slice(0, 5).map((preference, index) => (
                  <Badge key={index} variant="secondary">
                    {preference.length > 25 ? preference.substring(0, 25) + "..." : preference}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {insights.personalContext.relationships.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Relationships</h4>
              <div className="flex flex-wrap gap-1">
                {insights.personalContext.relationships.slice(0, 5).map((relationship, index) => (
                  <Badge key={index} variant="secondary">
                    {relationship}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Events */}
      {insights.personalContext.futureEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Future Events & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.personalContext.futureEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">
                    {event.event.length > 40 ? event.event.substring(0, 40) + "..." : event.event}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{event.date}</span>
                    <Progress value={event.importance * 100} className="w-16 h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disconnection Points */}
      {insights.disconnectionPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.disconnectionPoints.slice(0, 3).map((point, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-medium text-sm">{point.topic}</div>
                  <div className="text-xs text-gray-600">{point.context}</div>
                  <div className="text-xs text-gray-400">{new Date(point.timestamp).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
