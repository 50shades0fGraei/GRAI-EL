// Dialogue Guidance Framework for Graei AI
// This system guides conversations using time-based questions to build user profiles

import { PatternRecognitionSystem } from "./pattern-recognition"

export interface DialogueState {
  stage: "greeting" | "demographics" | "timeline" | "analysis" | "profile" | "conversation"
  currentQuestion: string
  questionHistory: Array<{ question: string; response: string }>
  userInfo: {
    age?: string
    location?: string
    name?: string
  }
  predictionAccuracy: number
  analysisComplete: boolean
}

export class DialogueFramework {
  private patternSystem: PatternRecognitionSystem
  private state: DialogueState
  private timelineQuestions: string[]

  constructor() {
    this.patternSystem = new PatternRecognitionSystem()
    this.state = {
      stage: "greeting",
      currentQuestion:
        "Hello! I'd like to get to know you better through a few questions about your experiences. This will help me provide more personalized assistance. Shall we begin?",
      questionHistory: [],
      userInfo: {},
      predictionAccuracy: 20,
      analysisComplete: false,
    }

    // Initialize timeline questions
    const currentYear = new Date().getFullYear()
    this.timelineQuestions = [
      `What were you doing in the summer of ${currentYear - 20}?`,
      "How did you feel about the music scene in the early 2000s?",
      "What's been the most significant challenge you've faced in your career so far?",
      "What were you doing in 1999?",
      "How did you feel about life in 1992?",
      "What was happening in your world in 2005?",
    ]
  }

  // Get current dialogue state
  getState(): DialogueState {
    return { ...this.state }
  }

  // Process user response and advance dialogue
  processResponse(userResponse: string): DialogueState {
    // Add to question history
    this.state.questionHistory.push({
      question: this.state.currentQuestion,
      response: userResponse,
    })

    // Add to pattern recognition system if not in greeting stage
    if (this.state.stage !== "greeting") {
      this.patternSystem.addResponse(this.state.currentQuestion, userResponse)
    }

    // Move to next stage or question
    switch (this.state.stage) {
      case "greeting":
        this.advanceToStage("demographics")
        break

      case "demographics":
        this.processUserInfo(userResponse)
        this.advanceToStage("timeline")
        break

      case "timeline":
        this.updatePredictionAccuracy()
        this.advanceTimelineOrAnalysis()
        break

      case "analysis":
        // This is handled internally
        break

      case "profile":
        this.handleProfileResponse(userResponse)
        break

      case "conversation":
        this.handleConversationResponse(userResponse)
        break
    }

    return { ...this.state }
  }

  // Extract user demographic information
  private processUserInfo(response: string): void {
    // Extract age
    const ageMatch = response.match(/\b(\d{1,2})\b/)
    const age = ageMatch ? ageMatch[1] : undefined

    // Extract name
    const namePatterns = [/my name is (\w+)/i, /i'm (\w+)/i, /i am (\w+)/i, /call me (\w+)/i]

    let name
    for (const pattern of namePatterns) {
      const match = response.match(pattern)
      if (match && match[1]) {
        name = match[1]
        break
      }
    }

    // Extract location
    const locationKeywords = ["from", "in", "live in", "living in", "based in"]
    let location
    for (const keyword of locationKeywords) {
      const regex = new RegExp(`${keyword}\\s+([A-Za-z\\s,]+)`)
      const match = response.match(regex)
      if (match && match[1]) {
        location = match[1].trim()
        break
      }
    }

    this.state.userInfo = {
      ...this.state.userInfo,
      age,
      location,
      name,
    }
  }

  // Update prediction accuracy based on number of questions answered
  private updatePredictionAccuracy(): void {
    // Increase accuracy with each timeline question
    // Start at 20%, max out at 95% after 5 questions
    const timelineQuestionsAnswered = this.state.questionHistory.filter((q) =>
      this.timelineQuestions.includes(q.question),
    ).length

    this.state.predictionAccuracy = Math.min(95, 20 + timelineQuestionsAnswered * 15)
  }

  // Advance to next timeline question or to analysis
  private advanceTimelineOrAnalysis(): void {
    // Check if we've asked enough timeline questions (at least 3)
    const timelineQuestionsAnswered = this.state.questionHistory.filter((q) =>
      this.timelineQuestions.includes(q.question),
    ).length

    if (timelineQuestionsAnswered >= 3) {
      // Move to analysis stage
      this.advanceToStage("analysis")

      // Perform pattern analysis (simulated delay)
      setTimeout(() => {
        this.state.analysisComplete = true
        this.advanceToStage("profile")
      }, 1500)
    } else {
      // Ask next timeline question
      const askedQuestions = this.state.questionHistory.map((q) => q.question)
      const availableQuestions = this.timelineQuestions.filter((q) => !askedQuestions.includes(q))

      if (availableQuestions.length > 0) {
        this.state.currentQuestion = availableQuestions[0]
      } else {
        // If we've asked all predefined questions, get recommended questions
        const recommendedQuestions = this.patternSystem.getRecommendedQuestions()
        this.state.currentQuestion = recommendedQuestions[0] || "What's something that's been on your mind lately?"
      }
    }
  }

  // Handle response in profile stage
  private handleProfileResponse(response: string): void {
    if (response.toLowerCase().includes("yes") || response.toLowerCase().includes("sure")) {
      this.state.currentQuestion =
        "Great! Here's what I've learned about you. Is there anything specific you'd like to know more about?"
    } else {
      this.state.currentQuestion = "No problem! Is there anything specific you'd like to talk about now?"
    }

    // Move to regular conversation
    this.advanceToStage("conversation")
  }

  // Handle response in conversation stage
  private handleConversationResponse(response: string): void {
    // Generate contextual response based on user profile
    const analysisResult = this.patternSystem.analyzePatterns()

    // Check if user is asking about their profile
    if (
      response.toLowerCase().includes("profile") ||
      response.toLowerCase().includes("learn") ||
      response.toLowerCase().includes("about me")
    ) {
      this.state.currentQuestion =
        "Based on our conversation, I've identified some key aspects of your profile. Would you like to know more about a specific area?"
    } else {
      // Generate a question based on their profile
      const demographicInfo = analysisResult.demographic.generation
        ? `As someone from the ${analysisResult.demographic.generation} generation, `
        : ""

      const valueInfo =
        analysisResult.beliefs.coreValues.length > 0
          ? `Given your interest in ${analysisResult.beliefs.coreValues[0]}, `
          : ""

      const randomQuestions = [
        `${demographicInfo}how do you feel about the current trends in technology?`,
        `${valueInfo}what are your thoughts on balancing personal and professional life?`,
        "What's something you're looking forward to in the coming months?",
        "How has your perspective changed over the years on what matters most to you?",
      ]

      this.state.currentQuestion = randomQuestions[Math.floor(Math.random() * randomQuestions.length)]
    }
  }

  // Advance to a specific stage
  private advanceToStage(stage: DialogueState["stage"]): void {
    this.state.stage = stage

    switch (stage) {
      case "demographics":
        this.state.currentQuestion =
          "Great! To get started, could you tell me a bit about yourself? How old are you and where are you from?"
        break

      case "timeline":
        this.state.currentQuestion = this.timelineQuestions[0]
        break

      case "analysis":
        this.state.currentQuestion =
          "Thank you for sharing! I'm analyzing your responses to better understand your perspective..."
        break

      case "profile":
        this.state.currentQuestion =
          "Based on our conversation, I've created a profile that will help me provide more personalized assistance. Would you like to see what I've learned about you?"
        break

      case "conversation":
        // Current question is set in the handler methods
        break
    }
  }

  // Get pattern analysis results
  getAnalysisResults() {
    return this.patternSystem.analyzePatterns()
  }

  // Reset the dialogue framework
  reset(): void {
    this.patternSystem.reset()
    this.state = {
      stage: "greeting",
      currentQuestion:
        "Hello! I'd like to get to know you better through a few questions about your experiences. This will help me provide more personalized assistance. Shall we begin?",
      questionHistory: [],
      userInfo: {},
      predictionAccuracy: 20,
      analysisComplete: false,
    }
  }
}
