// Pattern Recognition and Demographic Profiling System
// This system analyzes responses to time-based questions to infer demographic information,
// emotional profiles, and belief systems.

export interface TimeBasedResponse {
  question: string
  response: string
  timestamp: Date
  emotionalTone?: string
  keyTopics?: string[]
}

export interface DemographicProfile {
  generation?: string
  ageRange?: string
  birthYearEstimate?: number
  confidenceScore: number
  generationTraits: string[]
}

export interface EmotionalProfile {
  dominantEmotions: string[]
  emotionalStrengths: string[]
  emotionalWeaknesses: string[]
  copingMechanisms: string[]
  confidenceScore: number
}

export interface BeliefSystem {
  coreValues: string[]
  worldview: string
  priorities: string[]
  confidenceScore: number
}

export interface MindDataset {
  objectsOfImportance: string[]
  goalMotives: string[]
  likelyResponses: string[]
  underlyingValues: string[]
  confidenceScore: number
}

export interface PatternAnalysisResult {
  demographic: DemographicProfile
  emotional: EmotionalProfile
  beliefs: BeliefSystem
  mindDataset: MindDataset
  overallConfidence: number
}

export class PatternRecognitionSystem {
  private responses: TimeBasedResponse[] = []
  private generationMarkers: Record<string, { birthYears: [number, number]; markers: string[]; traits: string[] }> = {
    "Gen Z": {
      birthYears: [1997, 2012],
      markers: ["tiktok", "social media", "climate change", "digital native", "covid", "pandemic", "online learning"],
      traits: ["Digital native", "Social justice oriented", "Entrepreneurial", "Mental health aware"],
    },
    Millennial: {
      birthYears: [1981, 1996],
      markers: ["college debt", "housing market", "9/11", "2008 recession", "harry potter", "social media", "internet"],
      traits: ["Tech-savvy", "Experience-focused", "Socially conscious", "Career-driven"],
    },
    "Gen X": {
      birthYears: [1965, 1980],
      markers: ["cold war", "mtv", "reagan", "challenger", "berlin wall", "dial-up", "walkman"],
      traits: ["Independent", "Pragmatic", "Skeptical", "Self-reliant"],
    },
    Boomer: {
      birthYears: [1946, 1964],
      markers: ["vietnam", "woodstock", "kennedy", "moon landing", "watergate", "civil rights"],
      traits: ["Experience-rich", "Value-driven", "Relationship-focused", "Stability-oriented"],
    },
  }

  constructor() {}

  // Add a response to the analysis system
  addResponse(question: string, response: string): void {
    const newResponse: TimeBasedResponse = {
      question,
      response,
      timestamp: new Date(),
      emotionalTone: this.detectEmotionalTone(response),
      keyTopics: this.extractKeyTopics(response),
    }

    this.responses.push(newResponse)
    console.log(`Added response to question: "${question.substring(0, 30)}..."`)
  }

  // Analyze all collected responses to generate insights
  analyzePatterns(): PatternAnalysisResult {
    console.log(`Analyzing patterns from ${this.responses.length} responses...`)

    const demographic = this.inferDemographicProfile()
    const emotional = this.inferEmotionalProfile()
    const beliefs = this.inferBeliefSystem()
    const mindDataset = this.inferMindDataset()

    const overallConfidence =
      (demographic.confidenceScore +
        emotional.confidenceScore +
        beliefs.confidenceScore +
        mindDataset.confidenceScore) /
      4

    return {
      demographic,
      emotional,
      beliefs,
      mindDataset,
      overallConfidence,
    }
  }

  // Extract a person's age or birth year from responses
  private extractAgeReferences(): { age?: number; birthYear?: number; confidence: number } {
    let age: number | undefined
    let birthYear: number | undefined
    let confidence = 0
    const currentYear = new Date().getFullYear()

    // Look for direct age mentions
    for (const response of this.responses) {
      const ageMatch = response.response.match(/\b(?:I am|I'm)\s+(\d{1,2})\s+(?:years old|year old|years|year)\b/i)
      if (ageMatch && ageMatch[1]) {
        age = Number.parseInt(ageMatch[1])
        confidence = 0.9
        break
      }

      // Look for birth year mentions
      const birthYearMatch = response.response.match(/\b(?:born in|birth year|born)\s+(?:in\s+)?(\d{4})\b/i)
      if (birthYearMatch && birthYearMatch[1]) {
        birthYear = Number.parseInt(birthYearMatch[1])
        confidence = 0.85
        break
      }

      // Look for graduation year mentions
      const gradMatch = response.response.match(/\b(?:graduated|graduation|graduate)\s+(?:in|from)?\s+(\d{4})\b/i)
      if (gradMatch && gradMatch[1]) {
        const gradYear = Number.parseInt(gradMatch[1])
        // Estimate: college graduation at ~22 years old
        birthYear = gradYear - 22
        confidence = 0.6
      }

      // Look for historical event references
      if (
        response.response.includes("9/11") &&
        response.response.match(/\b(?:I was|I remember being)\s+(\d{1,2})\b/i)
      ) {
        const ageAt911 = Number.parseInt(response.response.match(/\b(?:I was|I remember being)\s+(\d{1,2})\b/i)![1])
        birthYear = 2001 - ageAt911
        confidence = 0.7
      }
    }

    // If we have birth year but not age, calculate age
    if (birthYear && !age) {
      age = currentYear - birthYear
    }

    // If we have age but not birth year, calculate birth year
    if (age && !birthYear) {
      birthYear = currentYear - age
    }

    return { age, birthYear, confidence }
  }

  // Infer demographic profile based on responses
  private inferDemographicProfile(): DemographicProfile {
    const ageInfo = this.extractAgeReferences()
    let generation: string | undefined
    let confidenceScore = ageInfo.confidence
    let generationTraits: string[] = []

    // Determine generation based on birth year
    if (ageInfo.birthYear) {
      for (const [gen, data] of Object.entries(this.generationMarkers)) {
        if (ageInfo.birthYear >= data.birthYears[0] && ageInfo.birthYear <= data.birthYears[1]) {
          generation = gen
          generationTraits = data.traits
          confidenceScore += 0.2
          break
        }
      }
    }

    // If we couldn't determine generation from birth year, try to infer from content
    if (!generation) {
      const allResponses = this.responses.map((r) => r.response.toLowerCase()).join(" ")
      let maxMatches = 0
      let bestMatch = ""

      for (const [gen, data] of Object.entries(this.generationMarkers)) {
        const matches = data.markers.filter((marker) => allResponses.includes(marker.toLowerCase())).length
        if (matches > maxMatches) {
          maxMatches = matches
          bestMatch = gen
          generationTraits = data.traits
        }
      }

      if (maxMatches > 0) {
        generation = bestMatch
        confidenceScore = Math.min(0.7, 0.3 + maxMatches * 0.1)
      }
    }

    // Determine age range based on generation
    let ageRange: string | undefined
    if (generation && this.generationMarkers[generation]) {
      const birthYearRange = this.generationMarkers[generation].birthYears
      const currentYear = new Date().getFullYear()
      const minAge = currentYear - birthYearRange[1]
      const maxAge = currentYear - birthYearRange[0]
      ageRange = `${minAge}-${maxAge}`
    } else if (ageInfo.age) {
      // If we have a specific age but no generation, create a narrow range
      ageRange = `${ageInfo.age - 2}-${ageInfo.age + 2}`
    }

    return {
      generation,
      ageRange,
      birthYearEstimate: ageInfo.birthYear,
      confidenceScore: Math.min(1.0, confidenceScore),
      generationTraits: generationTraits || [],
    }
  }

  // Detect emotional tone from text
  private detectEmotionalTone(text: string): string {
    const emotionKeywords: Record<string, string[]> = {
      happy: ["happy", "joy", "excited", "great", "wonderful", "amazing", "love"],
      sad: ["sad", "depressed", "down", "upset", "disappointed", "miserable"],
      angry: ["angry", "mad", "frustrated", "annoyed", "furious", "rage"],
      fearful: ["scared", "afraid", "worried", "anxious", "nervous", "terrified"],
      nostalgic: ["remember", "miss", "nostalgia", "back then", "those days", "childhood"],
      hopeful: ["hope", "looking forward", "excited about", "future", "plan", "dream"],
      regretful: ["regret", "wish I had", "should have", "missed opportunity"],
    }

    const textLower = text.toLowerCase()
    let dominantEmotion = "neutral"
    let maxMatches = 0

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const matches = keywords.filter((keyword) => textLower.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        dominantEmotion = emotion
      }
    }

    return dominantEmotion
  }

  // Extract key topics from text
  private extractKeyTopics(text: string): string[] {
    const topics: Record<string, string[]> = {
      career: ["job", "career", "work", "profession", "company", "business"],
      education: ["school", "college", "university", "degree", "study", "learn"],
      family: ["family", "parent", "child", "mother", "father", "sister", "brother"],
      relationships: ["friend", "relationship", "partner", "marriage", "date", "love"],
      health: ["health", "exercise", "diet", "doctor", "illness", "wellness"],
      finance: ["money", "finance", "budget", "saving", "investment", "debt"],
      hobbies: ["hobby", "interest", "sport", "game", "music", "art", "read"],
      technology: ["technology", "computer", "internet", "digital", "online", "app"],
      politics: ["politics", "government", "election", "vote", "policy", "law"],
      spirituality: ["god", "faith", "spiritual", "religion", "belief", "soul"],
    }

    const textLower = text.toLowerCase()
    const foundTopics: string[] = []

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some((keyword) => textLower.includes(keyword))) {
        foundTopics.push(topic)
      }
    }

    return foundTopics
  }

  // Infer emotional profile from responses
  private inferEmotionalProfile(): EmotionalProfile {
    const emotionCounts: Record<string, number> = {}
    const allEmotions: string[] = []

    // Count emotions across responses
    this.responses.forEach((response) => {
      if (response.emotionalTone) {
        emotionCounts[response.emotionalTone] = (emotionCounts[response.emotionalTone] || 0) + 1
        allEmotions.push(response.emotionalTone)
      }
    })

    // Determine dominant emotions
    const dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion)

    // Infer emotional strengths and weaknesses
    const emotionalStrengths: string[] = []
    const emotionalWeaknesses: string[] = []
    const copingMechanisms: string[] = []

    if (dominantEmotions.includes("happy") || dominantEmotions.includes("hopeful")) {
      emotionalStrengths.push("Optimism", "Positive outlook")
    }

    if (dominantEmotions.includes("nostalgic")) {
      emotionalStrengths.push("Strong memory recall", "Emotional connection to past")
      if (dominantEmotions.includes("sad")) {
        emotionalWeaknesses.push("May dwell on the past")
      }
    }

    if (dominantEmotions.includes("angry")) {
      emotionalWeaknesses.push("Frustration management")
      copingMechanisms.push("Needs healthy outlets for frustration")
    }

    if (dominantEmotions.includes("fearful")) {
      emotionalWeaknesses.push("Anxiety management")
      copingMechanisms.push("May benefit from stress reduction techniques")
    }

    if (dominantEmotions.includes("regretful")) {
      emotionalWeaknesses.push("Self-forgiveness")
      copingMechanisms.push("Needs to practice acceptance of past decisions")
    }

    // Calculate confidence score based on number of responses and consistency
    const uniqueEmotions = new Set(allEmotions).size
    const emotionalConsistency = uniqueEmotions > 0 ? allEmotions.length / uniqueEmotions : 0
    const confidenceScore = Math.min(1.0, this.responses.length * 0.2 * (emotionalConsistency * 0.5))

    return {
      dominantEmotions,
      emotionalStrengths: emotionalStrengths.length > 0 ? emotionalStrengths : ["Insufficient data"],
      emotionalWeaknesses: emotionalWeaknesses.length > 0 ? emotionalWeaknesses : ["Insufficient data"],
      copingMechanisms: copingMechanisms.length > 0 ? copingMechanisms : ["Insufficient data"],
      confidenceScore,
    }
  }

  // Infer belief system from responses
  private inferBeliefSystem(): BeliefSystem {
    const valueKeywords: Record<string, string[]> = {
      family: ["family", "parents", "children", "siblings", "relatives"],
      achievement: ["success", "achievement", "accomplish", "goal", "ambition"],
      security: ["security", "safety", "stability", "protection", "reliable"],
      freedom: ["freedom", "independence", "choice", "liberty", "autonomy"],
      tradition: ["tradition", "heritage", "culture", "custom", "ritual"],
      spirituality: ["god", "faith", "spiritual", "religion", "belief", "soul"],
      knowledge: ["knowledge", "learning", "education", "wisdom", "understanding"],
      creativity: ["creative", "art", "innovation", "original", "imagination"],
      "helping others": ["help", "service", "volunteer", "community", "giving back"],
      health: ["health", "wellness", "fitness", "wellbeing", "self-care"],
    }

    const worldviewKeywords: Record<string, string[]> = {
      optimistic: ["positive", "hopeful", "optimistic", "bright future", "opportunity"],
      pessimistic: ["negative", "worried", "pessimistic", "dark future", "problem"],
      pragmatic: ["practical", "realistic", "sensible", "logical", "rational"],
      idealistic: ["ideal", "perfect", "utopia", "dream", "vision", "should be"],
      individualistic: ["individual", "self", "personal", "own", "independent"],
      collectivistic: ["community", "together", "group", "society", "collective"],
    }

    // Count value and worldview matches
    const valueCounts: Record<string, number> = {}
    const worldviewCounts: Record<string, number> = {}

    const allResponses = this.responses.map((r) => r.response.toLowerCase()).join(" ")

    // Count value keywords
    for (const [value, keywords] of Object.entries(valueKeywords)) {
      valueCounts[value] = keywords.filter((keyword) => allResponses.includes(keyword)).length
    }

    // Count worldview keywords
    for (const [worldview, keywords] of Object.entries(worldviewKeywords)) {
      worldviewCounts[worldview] = keywords.filter((keyword) => allResponses.includes(keyword)).length
    }

    // Determine core values
    const coreValues = Object.entries(valueCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value]) => value)

    // Determine worldview
    const worldview =
      Object.entries(worldviewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1)
        .map(([view]) => view)[0] || "unclear"

    // Determine priorities based on topics mentioned
    const topicCounts: Record<string, number> = {}
    this.responses.forEach((response) => {
      if (response.keyTopics) {
        response.keyTopics.forEach((topic) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1
        })
      }
    })

    const priorities = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic)

    // Calculate confidence score
    const valueMatches = Object.values(valueCounts).reduce((sum, count) => sum + count, 0)
    const worldviewMatches = Object.values(worldviewCounts).reduce((sum, count) => sum + count, 0)
    const confidenceScore = Math.min(1.0, valueMatches * 0.1 + worldviewMatches * 0.1 + this.responses.length * 0.1)

    return {
      coreValues: coreValues.length > 0 ? coreValues : ["Insufficient data"],
      worldview,
      priorities: priorities.length > 0 ? priorities : ["Insufficient data"],
      confidenceScore,
    }
  }

  // Infer mind dataset from responses
  private inferMindDataset(): MindDataset {
    // Extract objects of importance
    const objectsOfImportance: string[] = []
    const allTopics: string[] = []

    this.responses.forEach((response) => {
      if (response.keyTopics) {
        allTopics.push(...response.keyTopics)
      }
    })

    // Count topic frequencies
    const topicCounts: Record<string, number> = {}
    allTopics.forEach((topic) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1
    })

    // Get top objects of importance
    objectsOfImportance.push(
      ...Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic),
    )

    // Infer goal motives based on objects of importance
    const goalMotives: string[] = []
    objectsOfImportance.forEach((object) => {
      switch (object) {
        case "career":
          goalMotives.push("Professional advancement", "Financial stability")
          break
        case "education":
          goalMotives.push("Knowledge acquisition", "Skill development")
          break
        case "family":
          goalMotives.push("Nurturing relationships", "Creating stability")
          break
        case "relationships":
          goalMotives.push("Connection", "Emotional fulfillment")
          break
        case "health":
          goalMotives.push("Wellbeing", "Longevity")
          break
        case "finance":
          goalMotives.push("Financial security", "Wealth building")
          break
        case "hobbies":
          goalMotives.push("Personal enjoyment", "Self-expression")
          break
        default:
          goalMotives.push("Personal fulfillment")
      }
    })

    // Infer likely responses based on emotional profile and objects of importance
    const likelyResponses: string[] = []
    const emotionalTones = this.responses.map((r) => r.emotionalTone).filter(Boolean) as string[]
    const dominantEmotion =
      emotionalTones.length > 0
        ? emotionalTones.sort(
            (a, b) => emotionalTones.filter((e) => e === a).length - emotionalTones.filter((e) => e === b).length,
          )[0]
        : "neutral"

    // Add likely responses based on dominant emotion
    switch (dominantEmotion) {
      case "happy":
        likelyResponses.push("Enthusiastic engagement", "Positive outlook on challenges")
        break
      case "sad":
        likelyResponses.push("Cautious approach", "Seeking emotional support")
        break
      case "angry":
        likelyResponses.push("Direct confrontation", "Seeking justice or resolution")
        break
      case "fearful":
        likelyResponses.push("Risk avoidance", "Seeking security and reassurance")
        break
      case "nostalgic":
        likelyResponses.push("Connection to past experiences", "Seeking familiar patterns")
        break
      default:
        likelyResponses.push("Balanced consideration", "Pragmatic approach")
    }

    // Infer underlying values
    const underlyingValues = this.inferBeliefSystem().coreValues

    // Calculate confidence score
    const confidenceScore = Math.min(
      1.0,
      objectsOfImportance.length * 0.1 +
        goalMotives.length * 0.1 +
        likelyResponses.length * 0.1 +
        this.responses.length * 0.1,
    )

    return {
      objectsOfImportance,
      goalMotives,
      likelyResponses,
      underlyingValues,
      confidenceScore,
    }
  }

  // Get recommended time-based questions based on current knowledge gaps
  getRecommendedQuestions(): string[] {
    const questions: string[] = []
    const currentYear = new Date().getFullYear()

    // If we don't have age/demographic info, ask time-based questions
    if (!this.extractAgeReferences().age) {
      questions.push(
        `What were you doing in the summer of ${currentYear - 20}?`,
        `How did you feel about the events of ${currentYear - 10}?`,
        `What was your favorite music or movie from the early ${Math.floor((currentYear - 15) / 10) * 10}s?`,
      )
    }

    // If we don't have enough emotional data
    if (this.responses.filter((r) => r.emotionalTone).length < 2) {
      questions.push(
        "What's a time in your life when you felt most proud?",
        "Can you tell me about a challenging period you've overcome?",
        "What's something you're looking forward to in the future?",
      )
    }

    // If we don't have belief system data
    if (this.inferBeliefSystem().confidenceScore < 0.4) {
      questions.push(
        "What values do you consider most important in life?",
        "How do you approach making difficult decisions?",
        "What do you think is most important for the next generation to understand?",
      )
    }

    // If we have few responses overall
    if (this.responses.length < 3) {
      questions.push(
        "What were you doing in 1999?",
        "How did you feel about life in 1992?",
        "What was happening in your world in 2005?",
      )
    }

    // Return unique questions, prioritizing those that fill knowledge gaps
    return [...new Set(questions)].slice(0, 5)
  }

  // Reset the system
  reset(): void {
    this.responses = []
    console.log("Pattern recognition system reset")
  }
}
