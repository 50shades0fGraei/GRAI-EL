"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PatternRecognitionSystem, type PatternAnalysisResult } from "@/lib/pattern-recognition"
import { Brain, Clock, User, MessageSquare, Lightbulb, ChevronRight, BarChart } from "lucide-react"

export function DialogueGuidance() {
  const [patternSystem] = useState(() => new PatternRecognitionSystem())
  const [currentQuestion, setCurrentQuestion] = useState<string>("")
  const [userResponse, setUserResponse] = useState<string>("")
  const [questionHistory, setQuestionHistory] = useState<Array<{ question: string; response: string }>>([])
  const [analysisResult, setAnalysisResult] = useState<PatternAnalysisResult | null>(null)
  const [stage, setStage] = useState<"greeting" | "demographics" | "timeline" | "analysis" | "profile">("greeting")
  const [userInfo, setUserInfo] = useState<{ age?: string; location?: string }>({})
  const [predictionAccuracy, setPredictionAccuracy] = useState<number>(20)

  // Initialize with greeting
  useEffect(() => {
    if (stage === "greeting") {
      setCurrentQuestion(
        "Hello! I'd like to get to know you better through a few questions about your experiences. This will help me provide more personalized assistance. Shall we begin?",
      )
    }
  }, [stage])

  // Handle user response submission
  const handleSubmitResponse = () => {
    if (!userResponse.trim()) return

    // Add to question history
    setQuestionHistory([
      ...questionHistory,
      {
        question: currentQuestion,
        response: userResponse,
      },
    ])

    // Add to pattern recognition system if not in greeting stage
    if (stage !== "greeting") {
      patternSystem.addResponse(currentQuestion, userResponse)
    }

    // Move to next stage or question
    switch (stage) {
      case "greeting":
        setStage("demographics")
        setCurrentQuestion(
          "Great! To get started, could you tell me a bit about yourself? How old are you and where are you from?",
        )
        break

      case "demographics":
        // Extract age and location from response
        const ageMatch = userResponse.match(/\b(\d{1,2})\b/)
        const age = ageMatch ? ageMatch[1] : undefined

        // Simple location extraction (very basic)
        const locationKeywords = ["from", "in", "live in", "living in", "based in"]
        let location
        for (const keyword of locationKeywords) {
          const regex = new RegExp(`${keyword}\\s+([A-Za-z\\s,]+)`)
          const match = userResponse.match(regex)
          if (match && match[1]) {
            location = match[1].trim()
            break
          }
        }

        setUserInfo({
          age,
          location,
        })

        setStage("timeline")
        setCurrentQuestion("What were you doing in the summer of 2005?")
        setPredictionAccuracy(20) // Start with baseline accuracy
        break

      case "timeline":
        // Update prediction accuracy based on number of questions answered
        const newAccuracy = Math.min(95, predictionAccuracy + 20)
        setPredictionAccuracy(newAccuracy)

        // Check if we've asked enough timeline questions
        if (
          questionHistory.filter(
            (q) =>
              q.question !==
                "Hello! I'd like to get to know you better through a few questions about your experiences. This will help me provide more personalized assistance. Shall we begin?" &&
              q.question !==
                "Great! To get started, could you tell me a bit about yourself? How old are you and where are you from?",
          ).length >= 2
        ) {
          // Move to analysis stage
          setStage("analysis")
          setCurrentQuestion(
            "Thank you for sharing! I'm analyzing your responses to better understand your perspective...",
          )

          // Perform pattern analysis
          setTimeout(() => {
            const result = patternSystem.analyzePatterns()
            setAnalysisResult(result)
            setStage("profile")
            setCurrentQuestion(
              "Based on our conversation, I've created a profile that will help me provide more personalized assistance. Would you like to see what I've learned about you?",
            )
          }, 1500)
        } else {
          // Ask next timeline question
          const nextQuestions = [
            "How did you feel about the music scene in the early 2000s?",
            "What's been the most significant challenge you've faced in your career so far?",
            "What were you doing in 1999?",
            "How did you feel about life in 1992?",
            "What was happening in your world in 2005?",
          ]

          // Filter out questions we've already asked
          const askedQuestions = questionHistory.map((q) => q.question)
          const availableQuestions = nextQuestions.filter((q) => !askedQuestions.includes(q))

          if (availableQuestions.length > 0) {
            setCurrentQuestion(availableQuestions[0])
          } else {
            // If we've asked all predefined questions, get recommended questions
            const recommendedQuestions = patternSystem.getRecommendedQuestions()
            setCurrentQuestion(recommendedQuestions[0] || "What's something that's been on your mind lately?")
          }
        }
        break

      case "analysis":
        // This is handled by the timeout in the timeline case
        break

      case "profile":
        // Reset for a new conversation if desired
        if (userResponse.toLowerCase().includes("yes") || userResponse.toLowerCase().includes("sure")) {
          setCurrentQuestion(
            "Great! Here's what I've learned about you. Is there anything specific you'd like to know more about?",
          )
        } else {
          setCurrentQuestion("No problem! Is there anything specific you'd like to talk about now?")
        }
        break
    }

    setUserResponse("")
  }

  return (
    <div className="flex flex-col space-y-4 w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Dialogue Guidance Framework
          </CardTitle>
          <CardDescription>Pattern recognition through time-based questions</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current stage indicator */}
          <div className="flex justify-between items-center mb-4">
            <Badge variant={stage === "greeting" ? "default" : "outline"} className="flex gap-1 items-center">
              <MessageSquare className="h-3 w-3" /> Greeting
            </Badge>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Badge variant={stage === "demographics" ? "default" : "outline"} className="flex gap-1 items-center">
              <User className="h-3 w-3" /> Demographics
            </Badge>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Badge variant={stage === "timeline" ? "default" : "outline"} className="flex gap-1 items-center">
              <Clock className="h-3 w-3" /> Timeline
            </Badge>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Badge variant={stage === "analysis" ? "default" : "outline"} className="flex gap-1 items-center">
              <BarChart className="h-3 w-3" /> Analysis
            </Badge>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Badge variant={stage === "profile" ? "default" : "outline"} className="flex gap-1 items-center">
              <Lightbulb className="h-3 w-3" /> Profile
            </Badge>
          </div>

          {/* Current question */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800">{currentQuestion}</p>
          </div>

          {/* User response input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Type your response here..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Prediction accuracy (only show during timeline stage) */}
          {stage === "timeline" && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Prediction Accuracy:</span>
              <div className="flex items-center gap-2">
                <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${predictionAccuracy}%` }}></div>
                </div>
                <span className="text-sm font-medium">{predictionAccuracy}%</span>
              </div>
            </div>
          )}

          {/* Analysis results (only show during profile stage) */}
          {stage === "profile" && analysisResult && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-1">Demographic Profile</h4>
                  <p className="text-sm">Generation: {analysisResult.demographic.generation || "Unknown"}</p>
                  <p className="text-sm">Age Range: {analysisResult.demographic.ageRange || "Unknown"}</p>
                  <p className="text-sm">Traits: {analysisResult.demographic.generationTraits.join(", ")}</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-medium text-purple-700 mb-1">Emotional Profile</h4>
                  <p className="text-sm">Dominant: {analysisResult.emotional.dominantEmotions.join(", ")}</p>
                  <p className="text-sm">Strengths: {analysisResult.emotional.emotionalStrengths.join(", ")}</p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-700 mb-1">Belief System</h4>
                  <p className="text-sm">Values: {analysisResult.beliefs.coreValues.join(", ")}</p>
                  <p className="text-sm">Worldview: {analysisResult.beliefs.worldview}</p>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg">
                  <h4 className="font-medium text-amber-700 mb-1">Mind Dataset</h4>
                  <p className="text-sm">Important: {analysisResult.mindDataset.objectsOfImportance.join(", ")}</p>
                  <p className="text-sm">Motives: {analysisResult.mindDataset.goalMotives.join(", ")}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-1">Overall Confidence</h4>
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${analysisResult.overallConfidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(analysisResult.overallConfidence * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              patternSystem.reset()
              setQuestionHistory([])
              setAnalysisResult(null)
              setStage("greeting")
              setUserInfo({})
              setPredictionAccuracy(20)
            }}
          >
            Reset
          </Button>
          <Button onClick={handleSubmitResponse}>Submit Response</Button>
        </CardFooter>
      </Card>

      {/* Question history */}
      {questionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversation History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questionHistory.map((item, index) => (
              <div key={index} className="space-y-1">
                <p className="text-sm font-medium text-gray-700">{item.question}</p>
                <p className="text-sm bg-gray-50 p-2 rounded">{item.response}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
