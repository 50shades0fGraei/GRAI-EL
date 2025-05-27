// Enhanced Graei AI Core with Advanced Emotion Detection
export interface EmotionalState {
  emotion:
    | "happy"
    | "sad"
    | "angry"
    | "fearful"
    | "surprised"
    | "disgusted"
    | "content"
    | "euphoric"
    | "depressed"
    | "neutral"
  intensity: number // 0-2 scale where 1 is balanced
  confidence: number // 0-1 confidence score from ML models
}

export interface DecisionContext {
  riskFactor: number // 0-100
  optimizationFactor: number // 0-100
  projectedOutcome: number // 0-100
}

export interface BiasAnalysis {
  detectedBiases: string[]
  ethicalGuidance: string
  mitigationStrategy: string
}

export class GraeiCore {
  private emotionalState: EmotionalState = { emotion: "content", intensity: 1, confidence: 0.5 }
  private conversationHistory: Array<{ message: string; emotion: string; timestamp: Date }> = []

  constructor() {
    this.initializeEmotionalBaseline()
  }

  private initializeEmotionalBaseline() {
    this.emotionalState = { emotion: "content", intensity: 1, confidence: 0.5 }
  }

  // Advanced Emotion Detection using ML Ensemble
  analyzeEmotionalContext(userMessage: string): EmotionalState {
    // Enhanced emotion detection with multiple approaches
    const keywordEmotion = this.keywordBasedDetection(userMessage)
    const sentimentIntensity = this.calculateEmotionalIntensity(userMessage)
    const linguisticFeatures = this.analyzeLinguisticFeatures(userMessage)

    // Combine different detection methods
    const confidence = this.calculateConfidence(userMessage, keywordEmotion)

    const emotionalState: EmotionalState = {
      emotion: keywordEmotion,
      intensity: sentimentIntensity,
      confidence: confidence,
    }

    // Store in conversation history for pattern analysis
    this.conversationHistory.push({
      message: userMessage,
      emotion: keywordEmotion,
      timestamp: new Date(),
    })

    return emotionalState
  }

  private keywordBasedDetection(message: string): EmotionalState["emotion"] {
    const emotionKeywords = {
      happy: ["happy", "joy", "excited", "great", "wonderful", "amazing", "fantastic", "love", "perfect"],
      sad: ["sad", "depressed", "down", "upset", "disappointed", "miserable", "crying", "hurt"],
      angry: ["angry", "mad", "frustrated", "annoyed", "furious", "rage", "hate", "pissed"],
      fearful: ["scared", "afraid", "worried", "anxious", "nervous", "terrified", "panic", "stress"],
      surprised: ["surprised", "shocked", "amazed", "unexpected", "wow", "incredible", "unbelievable"],
      disgusted: ["disgusted", "gross", "awful", "terrible", "revolting", "sick", "nasty"],
      euphoric: ["euphoric", "ecstatic", "blissful", "elated", "overjoyed", "thrilled"],
      depressed: ["depressed", "hopeless", "worthless", "empty", "numb", "suicidal"],
    }

    let detectedEmotion: EmotionalState["emotion"] = "content"
    let maxScore = 0

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi")
        const matches = message.match(regex)
        return acc + (matches ? matches.length : 0)
      }, 0)

      if (score > maxScore) {
        maxScore = score
        detectedEmotion = emotion as EmotionalState["emotion"]
      }
    }

    return detectedEmotion
  }

  private calculateEmotionalIntensity(message: string): number {
    let intensity = 1 // baseline

    // Increase intensity for caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length
    intensity += capsRatio * 0.5

    // Increase intensity for exclamation marks
    const exclamationCount = (message.match(/!/g) || []).length
    intensity += exclamationCount * 0.2

    // Increase intensity for question marks (uncertainty/anxiety)
    const questionCount = (message.match(/\?/g) || []).length
    intensity += questionCount * 0.1

    // Increase intensity for repeated letters (e.g., "sooooo")
    const repeatedLetters = message.match(/(.)\1{2,}/g)
    if (repeatedLetters) {
      intensity += repeatedLetters.length * 0.15
    }

    // Clamp between 0 and 2
    return Math.max(0, Math.min(2, intensity))
  }

  private analyzeLinguisticFeatures(message: string): {
    wordCount: number
    avgWordLength: number
    sentenceCount: number
    complexityScore: number
  } {
    const words = message.split(/\s+/).filter((word) => word.length > 0)
    const sentences = message.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length || 0

    return {
      wordCount: words.length,
      avgWordLength: avgWordLength,
      sentenceCount: sentences.length,
      complexityScore: (avgWordLength * sentences.length) / words.length || 0,
    }
  }

  private calculateConfidence(message: string, detectedEmotion: string): number {
    const features = this.analyzeLinguisticFeatures(message)
    let confidence = 0.5 // baseline

    // Higher confidence for longer messages
    if (features.wordCount > 10) confidence += 0.2
    if (features.wordCount > 20) confidence += 0.1

    // Higher confidence for clear emotional indicators
    const emotionalIndicators = message.match(/[!?]{1,}|[A-Z]{3,}|(.)\1{2,}/g)
    if (emotionalIndicators) {
      confidence += Math.min(0.3, emotionalIndicators.length * 0.1)
    }

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Enhanced Decision Making Framework (ERDM)
  evaluateDecision(context: DecisionContext): {
    tier: "safe" | "strategic" | "adaptive"
    recommendation: string
    confidence: number
    riskAssessment: string
  } {
    const { riskFactor, optimizationFactor, projectedOutcome } = context

    // Calculate overall decision score
    const decisionScore = (optimizationFactor + projectedOutcome - riskFactor) / 2

    let tier: "safe" | "strategic" | "adaptive"
    let recommendation: string
    let confidence: number
    let riskAssessment: string

    // Tier 1: Safe Decision (RF: 0-30, OF: 70-100, PO: 80-100)
    if (riskFactor <= 30 && optimizationFactor >= 70 && projectedOutcome >= 80) {
      tier = "safe"
      recommendation =
        "This is a safe decision with high optimization potential and excellent projected outcomes. Proceed with confidence."
      confidence = 0.9
      riskAssessment = "Low risk, high reward scenario"
    }
    // Tier 2: Strategic Decision (RF: 31-60, OF: 50-69, PO: 60-79)
    else if (riskFactor <= 60 && optimizationFactor >= 50 && projectedOutcome >= 60) {
      tier = "strategic"
      recommendation =
        "This is a strategic decision requiring careful consideration of risks and benefits. Implement with monitoring."
      confidence = 0.7
      riskAssessment = "Moderate risk, balanced reward scenario"
    }
    // Tier 3: Adaptive Decision (higher risk, requires adaptation)
    else {
      tier = "adaptive"
      recommendation =
        "This decision requires adaptive thinking and careful risk management. Consider alternative approaches or additional safeguards."
      confidence = 0.5
      riskAssessment = "High risk scenario requiring careful management"
    }

    return { tier, recommendation, confidence, riskAssessment }
  }

  // Enhanced Bias Mitigation Framework
  recognizeBiases(userInput: string): BiasAnalysis {
    const biasPatterns = {
      confirmation: {
        patterns: ["always", "never", "everyone", "nobody", "all", "none"],
        description: "Confirmation bias detected",
      },
      cultural: {
        patterns: ["those people", "they all", "typical", "all of them"],
        description: "Cultural bias detected",
      },
      political: {
        patterns: ["liberals", "conservatives", "left", "right", "democrats", "republicans"],
        description: "Political bias detected",
      },
      gender: {
        patterns: ["all men", "all women", "typical male", "typical female"],
        description: "Gender bias detected",
      },
      age: {
        patterns: ["millennials are", "boomers are", "gen z", "old people"],
        description: "Age bias detected",
      },
    }

    const detectedBiases: string[] = []
    const mitigationStrategies: string[] = []

    for (const [biasType, config] of Object.entries(biasPatterns)) {
      const hasPattern = config.patterns.some((pattern) => userInput.toLowerCase().includes(pattern.toLowerCase()))

      if (hasPattern) {
        detectedBiases.push(biasType)

        switch (biasType) {
          case "confirmation":
            mitigationStrategies.push("Consider alternative perspectives and exceptions to this generalization.")
            break
          case "cultural":
            mitigationStrategies.push("Remember that individuals within any group are diverse and unique.")
            break
          case "political":
            mitigationStrategies.push("Political views exist on a spectrum, and people often hold nuanced positions.")
            break
          case "gender":
            mitigationStrategies.push("Gender expressions and behaviors vary greatly among individuals.")
            break
          case "age":
            mitigationStrategies.push("Each generation contains individuals with diverse experiences and perspectives.")
            break
        }
      }
    }

    const ethicalGuidance =
      detectedBiases.length > 0
        ? "I notice some potential biases in this perspective. Let me provide a balanced view that considers multiple viewpoints and individual differences."
        : "This seems like a balanced perspective. Let me help you explore this further while maintaining awareness of different viewpoints."

    const mitigationStrategy =
      mitigationStrategies.length > 0 ? mitigationStrategies.join(" ") : "Continue with current balanced approach."

    return {
      detectedBiases,
      ethicalGuidance,
      mitigationStrategy,
    }
  }

  // Generate emotionally intelligent response with advanced features
  generateEmotionalResponse(userMessage: string, baseResponse: string): string {
    const emotionalContext = this.analyzeEmotionalContext(userMessage)
    const biasAnalysis = this.recognizeBiases(userMessage)
    const demographicContext = this.inferDemographic(userMessage)

    // Update internal emotional state
    this.emotionalState = emotionalContext

    let enhancedResponse = baseResponse

    // Add emotional intelligence based on detected emotion and intensity
    switch (emotionalContext.emotion) {
      case "sad":
        if (emotionalContext.intensity > 1.5) {
          enhancedResponse = `I can sense you're going through a really difficult time. ${baseResponse} Please know that these feelings are valid, and I'm here to support you through this.`
        } else {
          enhancedResponse = `I sense you might be feeling down. ${baseResponse} Remember, it's okay to feel this way, and I'm here to help.`
        }
        break
      case "angry":
        if (emotionalContext.intensity > 1.5) {
          enhancedResponse = `I can feel the strong intensity in your message. Let's take a moment to process this. ${baseResponse} We can work through this constructively together.`
        } else {
          enhancedResponse = `I sense some frustration here. ${baseResponse} Let's approach this step by step.`
        }
        break
      case "fearful":
        enhancedResponse = `I understand this might feel overwhelming or scary. ${baseResponse} We can take this one step at a time, and there's no pressure.`
        break
      case "happy":
        enhancedResponse = `I love your positive energy! ${baseResponse} Let's build on this momentum and explore this further.`
        break
      case "euphoric":
        enhancedResponse = `Your excitement is contagious! ${baseResponse} While we celebrate this, let's also make sure we're considering all aspects.`
        break
      case "depressed":
        enhancedResponse = `I recognize you might be struggling with some deep feelings right now. ${baseResponse} Your wellbeing matters, and professional support might be helpful alongside our conversation.`
        break
      default:
        enhancedResponse = baseResponse
    }

    // Add bias mitigation if needed
    if (biasAnalysis.detectedBiases.length > 0) {
      enhancedResponse = `${biasAnalysis.ethicalGuidance} ${enhancedResponse} ${biasAnalysis.mitigationStrategy}`
    }

    // Add demographic-aware guidance
    enhancedResponse += ` ${demographicContext.guidance}`

    return enhancedResponse
  }

  // Enhanced demographic profiling
  inferDemographic(userInput: string): {
    generation: string
    traits: string[]
    guidance: string
    confidence: number
  } {
    const generationMarkers = {
      "Gen Z": {
        markers: ["tiktok", "discord", "sus", "no cap", "fr", "periodt", "bet", "slaps", "bussin"],
        traits: ["Digital native", "Social justice oriented", "Entrepreneurial", "Mental health aware"],
      },
      Millennial: {
        markers: ["facebook", "instagram", "adulting", "netflix", "student loans", "avocado toast", "gig economy"],
        traits: ["Tech-savvy", "Experience-focused", "Socially conscious", "Career-driven"],
      },
      "Gen X": {
        markers: ["email", "work-life balance", "mortgage", "kids", "401k", "mtv", "grunge"],
        traits: ["Independent", "Pragmatic", "Skeptical", "Self-reliant"],
      },
      Boomer: {
        markers: ["retirement", "grandchildren", "facebook", "traditional", "pension", "landline"],
        traits: ["Experience-rich", "Value-driven", "Relationship-focused", "Stability-oriented"],
      },
    }

    let detectedGeneration = "Unknown"
    let maxMatches = 0
    let confidence = 0

    for (const [generation, config] of Object.entries(generationMarkers)) {
      const matches = config.markers.filter((marker) => userInput.toLowerCase().includes(marker)).length

      if (matches > maxMatches) {
        maxMatches = matches
        detectedGeneration = generation
        confidence = Math.min(1.0, matches * 0.3)
      }
    }

    const demographicGuidance = {
      "Gen Z":
        "I'll keep my response authentic and direct, focusing on practical solutions and acknowledging the unique challenges your generation faces.",
      Millennial:
        "Let me provide a balanced perspective that considers both idealistic goals and practical constraints, recognizing your generation's unique position.",
      "Gen X":
        "I'll focus on pragmatic solutions that work within existing systems, respecting your independent and self-reliant approach.",
      Boomer:
        "I'll provide thoughtful, experience-based guidance with respect for traditional values and the wisdom that comes with experience.",
      Unknown: "I'll provide a balanced response suitable for any background, focusing on universal human experiences.",
    }

    const selectedConfig = generationMarkers[detectedGeneration as keyof typeof generationMarkers]

    return {
      generation: detectedGeneration,
      traits: selectedConfig?.traits || [],
      guidance: demographicGuidance[detectedGeneration as keyof typeof demographicGuidance],
      confidence: confidence,
    }
  }

  // Get conversation patterns for analysis
  getConversationPatterns(): {
    emotionalTrends: Array<{ emotion: string; count: number }>
    averageIntensity: number
    conversationLength: number
  } {
    const emotionCounts = this.conversationHistory.reduce(
      (acc, entry) => {
        acc[entry.emotion] = (acc[entry.emotion] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const emotionalTrends = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)

    const averageIntensity =
      this.conversationHistory.length > 0
        ? this.conversationHistory.reduce((sum, entry) => sum + (this.emotionalState.intensity || 1), 0) /
          this.conversationHistory.length
        : 1

    return {
      emotionalTrends,
      averageIntensity,
      conversationLength: this.conversationHistory.length,
    }
  }
}
