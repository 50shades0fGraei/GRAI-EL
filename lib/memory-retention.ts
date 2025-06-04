// Enhanced Memory Retention Framework with Persistent Storage
export interface MemoryNode {
  id: string
  content: string
  emotion: string
  intensity: number
  timestamp: Date
  connections: string[]
  importance: number
  hardwareState: HardwareState
  userId: string
  tags: string[]
  accessCount: number
  lastAccessed: Date
}

export interface HardwareState {
  cpuFrequency: number
  memoryUsage: number
  processingSpeed: number
  emotionalLoad: number
}

export interface ConversationProfile {
  userId: string
  emotionalPatterns: Array<{
    emotion: string
    frequency: number
    triggers: string[]
    responses: string[]
    lastSeen: Date
  }>
  personalContext: {
    goals: string[]
    challenges: string[]
    preferences: string[]
    relationships: string[]
    futureEvents: Array<{
      event: string
      date: string
      importance: number
      mentioned: Date
    }>
    topics: Array<{
      topic: string
      frequency: number
      sentiment: string
      lastDiscussed: Date
    }>
  }
  disconnectionPoints: Array<{
    topic: string
    context: string
    timestamp: Date
    resolution?: string
  }>
  hardwareOptimization: {
    preferredStates: Record<string, HardwareState>
    adaptationHistory: Array<{
      emotion: string
      optimization: HardwareState
      effectiveness: number
    }>
  }
  conversationHistory: Array<{
    messageId: string
    content: string
    emotion: string
    timestamp: Date
    importance: number
  }>
}

export class MemoryRetentionSystem {
  private memories: Map<string, MemoryNode> = new Map()
  private profiles: Map<string, ConversationProfile> = new Map()
  private currentHardwareState: HardwareState = {
    cpuFrequency: 1.0,
    memoryUsage: 1.0,
    processingSpeed: 1.0,
    emotionalLoad: 0.5,
  }

  constructor() {
    this.initializeSystem()
    this.loadFromStorage()
  }

  private initializeSystem() {
    // Initialize with baseline hardware state
    this.currentHardwareState = {
      cpuFrequency: 1.0,
      memoryUsage: 1.0,
      processingSpeed: 1.0,
      emotionalLoad: 0.5,
    }
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return

    try {
      // Load memories from localStorage
      const storedMemories = localStorage.getItem("graei_memories")
      if (storedMemories) {
        const memoriesData = JSON.parse(storedMemories)
        Object.entries(memoriesData).forEach(([id, memory]: [string, any]) => {
          this.memories.set(id, {
            ...memory,
            timestamp: new Date(memory.timestamp),
            lastAccessed: new Date(memory.lastAccessed),
          })
        })
        console.log(`Loaded ${this.memories.size} memories from storage`)
      }

      // Load profiles from localStorage
      const storedProfiles = localStorage.getItem("graei_profiles")
      if (storedProfiles) {
        const profilesData = JSON.parse(storedProfiles)
        Object.entries(profilesData).forEach(([userId, profile]: [string, any]) => {
          this.profiles.set(userId, {
            ...profile,
            emotionalPatterns:
              profile.emotionalPatterns?.map((p: any) => ({
                ...p,
                lastSeen: new Date(p.lastSeen),
              })) || [],
            personalContext: {
              ...profile.personalContext,
              futureEvents:
                profile.personalContext?.futureEvents?.map((e: any) => ({
                  ...e,
                  mentioned: new Date(e.mentioned),
                })) || [],
              topics:
                profile.personalContext?.topics?.map((t: any) => ({
                  ...t,
                  lastDiscussed: new Date(t.lastDiscussed),
                })) || [],
            },
            conversationHistory:
              profile.conversationHistory?.map((h: any) => ({
                ...h,
                timestamp: new Date(h.timestamp),
              })) || [],
          })
        })
        console.log(`Loaded ${this.profiles.size} user profiles from storage`)
      }
    } catch (error) {
      console.error("Failed to load memory data from storage:", error)
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return

    try {
      // Save memories to localStorage
      const memoriesData: Record<string, any> = {}
      this.memories.forEach((memory, id) => {
        memoriesData[id] = {
          ...memory,
          timestamp: memory.timestamp.toISOString(),
          lastAccessed: memory.lastAccessed.toISOString(),
        }
      })
      localStorage.setItem("graei_memories", JSON.stringify(memoriesData))

      // Save profiles to localStorage
      const profilesData: Record<string, any> = {}
      this.profiles.forEach((profile, userId) => {
        profilesData[userId] = {
          ...profile,
          emotionalPatterns: profile.emotionalPatterns.map((p) => ({
            ...p,
            lastSeen: p.lastSeen.toISOString(),
          })),
          personalContext: {
            ...profile.personalContext,
            futureEvents: profile.personalContext.futureEvents.map((e) => ({
              ...e,
              mentioned: e.mentioned.toISOString(),
            })),
            topics: profile.personalContext.topics.map((t) => ({
              ...t,
              lastDiscussed: t.lastDiscussed.toISOString(),
            })),
          },
          conversationHistory: profile.conversationHistory.map((h) => ({
            ...h,
            timestamp: h.timestamp.toISOString(),
          })),
        }
      })
      localStorage.setItem("graei_profiles", JSON.stringify(profilesData))

      console.log("Memory data saved to storage")
    } catch (error) {
      console.error("Failed to save memory data to storage:", error)
    }
  }

  // Hardware Optimization Based on Emotions
  optimizeHardwareForEmotion(emotion: string, intensity: number): HardwareState {
    const optimizations: Record<string, (intensity: number) => HardwareState> = {
      happy: (intensity) => ({
        cpuFrequency: 1.0 + intensity * 0.5,
        memoryUsage: 1.0 + intensity * 0.3,
        processingSpeed: 1.0 + intensity * 0.4,
        emotionalLoad: intensity,
      }),
      sad: (intensity) => ({
        cpuFrequency: 1.0 - intensity * 0.3,
        memoryUsage: 1.0 + intensity * 0.2,
        processingSpeed: 1.0 - intensity * 0.4,
        emotionalLoad: intensity,
      }),
      angry: (intensity) => ({
        cpuFrequency: 1.0 + intensity * 0.6,
        memoryUsage: 1.0 + intensity * 0.1,
        processingSpeed: 1.0 + intensity * 0.3,
        emotionalLoad: intensity,
      }),
      fearful: (intensity) => ({
        cpuFrequency: 1.0 + intensity * 0.7,
        memoryUsage: 1.0,
        processingSpeed: 1.0 + intensity * 0.5,
        emotionalLoad: intensity,
      }),
      surprised: (intensity) => ({
        cpuFrequency: 1.0 + intensity * 0.8,
        memoryUsage: 1.0 + intensity * 0.4,
        processingSpeed: 1.0 + intensity * 0.6,
        emotionalLoad: intensity,
      }),
      disgusted: (intensity) => ({
        cpuFrequency: 1.0 - intensity * 0.2,
        memoryUsage: 1.0 - intensity * 0.1,
        processingSpeed: 1.0 - intensity * 0.3,
        emotionalLoad: intensity,
      }),
    }

    const optimizer = optimizations[emotion] || optimizations.happy
    const newState = optimizer(intensity)
    this.currentHardwareState = newState
    return newState
  }

  // Store memory with enhanced context extraction
  storeMemory(content: string, emotion: string, intensity: number, userId: string, importance = 0.5): string {
    const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hardwareState = this.optimizeHardwareForEmotion(emotion, intensity)

    const memory: MemoryNode = {
      id: memoryId,
      content,
      emotion,
      intensity,
      timestamp: new Date(),
      connections: [],
      importance,
      hardwareState,
      userId,
      tags: this.extractTags(content, emotion),
      accessCount: 0,
      lastAccessed: new Date(),
    }

    this.memories.set(memoryId, memory)
    this.updateProfile(userId, memory)
    this.saveToStorage()

    console.log(`Stored memory for user ${userId}: ${content.substring(0, 50)}...`)
    return memoryId
  }

  private extractTags(content: string, emotion: string): string[] {
    const tags = [emotion]

    // Extract common topics and keywords
    const topicKeywords = {
      work: ["work", "job", "career", "office", "meeting", "project", "deadline", "boss", "colleague"],
      family: ["family", "mom", "dad", "sister", "brother", "parent", "child", "kids", "spouse"],
      health: ["health", "doctor", "medicine", "exercise", "diet", "sick", "pain", "therapy"],
      technology: ["code", "programming", "computer", "software", "app", "website", "AI", "tech"],
      education: ["school", "study", "learn", "class", "teacher", "student", "homework", "exam"],
      hobbies: ["hobby", "music", "art", "sports", "game", "book", "movie", "travel"],
      relationships: ["friend", "relationship", "dating", "love", "partner", "social"],
    }

    const contentLower = content.toLowerCase()
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some((keyword) => contentLower.includes(keyword))) {
        tags.push(topic)
      }
    })

    // Extract time-related tags
    if (contentLower.includes("tomorrow") || contentLower.includes("next")) tags.push("future")
    if (contentLower.includes("yesterday") || contentLower.includes("last")) tags.push("past")
    if (contentLower.includes("today") || contentLower.includes("now")) tags.push("present")

    return tags
  }

  // Enhanced profile updating with better context extraction
  private updateProfile(userId: string, memory: MemoryNode) {
    let profile = this.profiles.get(userId)
    if (!profile) {
      profile = this.createNewProfile(userId)
    }

    // Update emotional patterns
    const existingPattern = profile.emotionalPatterns.find((p) => p.emotion === memory.emotion)
    if (existingPattern) {
      existingPattern.frequency++
      existingPattern.lastSeen = new Date()
      if (!existingPattern.triggers.includes(memory.content.substring(0, 50))) {
        existingPattern.triggers.push(memory.content.substring(0, 50))
      }
    } else {
      profile.emotionalPatterns.push({
        emotion: memory.emotion,
        frequency: 1,
        triggers: [memory.content.substring(0, 50)],
        responses: [],
        lastSeen: new Date(),
      })
    }

    // Extract and update personal context
    this.extractPersonalContext(memory.content, profile)
    this.extractTopics(memory.content, memory.emotion, profile)

    // Add to conversation history
    profile.conversationHistory.push({
      messageId: memory.id,
      content: memory.content,
      emotion: memory.emotion,
      timestamp: memory.timestamp,
      importance: memory.importance,
    })

    // Keep only last 100 conversation entries
    if (profile.conversationHistory.length > 100) {
      profile.conversationHistory = profile.conversationHistory.slice(-100)
    }

    this.profiles.set(userId, profile)
  }

  private extractTopics(content: string, emotion: string, profile: ConversationProfile) {
    // Extract key topics from the conversation
    const words = content.toLowerCase().split(/\s+/)
    const significantWords = words.filter(
      (word) =>
        word.length > 3 &&
        ![
          "this",
          "that",
          "with",
          "have",
          "will",
          "been",
          "were",
          "they",
          "them",
          "what",
          "when",
          "where",
          "how",
        ].includes(word),
    )

    significantWords.forEach((word) => {
      const existingTopic = profile.personalContext.topics.find((t) => t.topic === word)
      if (existingTopic) {
        existingTopic.frequency++
        existingTopic.lastDiscussed = new Date()
        existingTopic.sentiment = emotion
      } else if (significantWords.length <= 10) {
        // Only add if not too many topics
        profile.personalContext.topics.push({
          topic: word,
          frequency: 1,
          sentiment: emotion,
          lastDiscussed: new Date(),
        })
      }
    })

    // Keep only top 50 topics
    profile.personalContext.topics.sort((a, b) => b.frequency - a.frequency)
    profile.personalContext.topics = profile.personalContext.topics.slice(0, 50)
  }

  private createNewProfile(userId: string): ConversationProfile {
    return {
      userId,
      emotionalPatterns: [],
      personalContext: {
        goals: [],
        challenges: [],
        preferences: [],
        relationships: [],
        futureEvents: [],
        topics: [],
      },
      disconnectionPoints: [],
      hardwareOptimization: {
        preferredStates: {},
        adaptationHistory: [],
      },
      conversationHistory: [],
    }
  }

  // Enhanced future events and personal context extraction
  private extractPersonalContext(content: string, profile: ConversationProfile) {
    const futureIndicators = [
      { pattern: /(?:later|tomorrow|next week|next month|planning to|going to|will|gonna)\s+(.+)/gi, type: "future" },
      { pattern: /(?:I need to|I have to|I must|I should)\s+(.+)/gi, type: "task" },
      { pattern: /(?:my goal is|I want to|hoping to|trying to)\s+(.+)/gi, type: "goal" },
      { pattern: /(?:struggling with|difficult|problem with|challenge)\s+(.+)/gi, type: "challenge" },
      { pattern: /(?:I like|I love|I prefer|I enjoy)\s+(.+)/gi, type: "preference" },
      {
        pattern:
          /(?:my|with my)\s+(mom|dad|sister|brother|friend|partner|spouse|wife|husband|boss|colleague)\s*(.+)?/gi,
        type: "relationship",
      },
    ]

    futureIndicators.forEach(({ pattern, type }) => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const extracted = match[1]?.trim()
        if (extracted && extracted.length > 2) {
          switch (type) {
            case "future":
            case "task":
              if (!profile.personalContext.futureEvents.some((e) => e.event === extracted)) {
                profile.personalContext.futureEvents.push({
                  event: extracted,
                  date: "TBD",
                  importance: 0.7,
                  mentioned: new Date(),
                })
              }
              break
            case "goal":
              if (!profile.personalContext.goals.includes(extracted)) {
                profile.personalContext.goals.push(extracted)
              }
              break
            case "challenge":
              if (!profile.personalContext.challenges.includes(extracted)) {
                profile.personalContext.challenges.push(extracted)
              }
              break
            case "preference":
              if (!profile.personalContext.preferences.includes(extracted)) {
                profile.personalContext.preferences.push(extracted)
              }
              break
            case "relationship":
              const relationship = match[1] + (match[2] ? ` ${match[2]}` : "")
              if (!profile.personalContext.relationships.includes(relationship)) {
                profile.personalContext.relationships.push(relationship)
              }
              break
          }
        }
      }
    })

    // Limit arrays to prevent memory bloat
    profile.personalContext.goals = profile.personalContext.goals.slice(-20)
    profile.personalContext.challenges = profile.personalContext.challenges.slice(-20)
    profile.personalContext.preferences = profile.personalContext.preferences.slice(-30)
    profile.personalContext.relationships = profile.personalContext.relationships.slice(-15)
    profile.personalContext.futureEvents = profile.personalContext.futureEvents.slice(-25)
  }

  // Generate contextual responses based on memory
  generateContextualResponse(userId: string, currentMessage: string): string {
    const profile = this.profiles.get(userId)
    if (!profile) return ""

    const relevantMemories = this.retrieveRelevantMemories(currentMessage, userId, 5)
    const recentEmotions = profile.emotionalPatterns
      .filter((p) => p.lastSeen > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last week
      .sort((a, b) => b.frequency - a.frequency)

    const contextualInfo = []

    // Add memory context
    if (relevantMemories.length > 0) {
      contextualInfo.push(`I remember we discussed: ${relevantMemories[0].content.substring(0, 100)}...`)
    }

    // Add emotional context
    if (recentEmotions.length > 0) {
      contextualInfo.push(`I notice you've been feeling ${recentEmotions[0].emotion} lately.`)
    }

    // Add personal context
    if (profile.personalContext.goals.length > 0) {
      contextualInfo.push(`Considering your goal to ${profile.personalContext.goals[0]}.`)
    }

    // Add future events
    if (profile.personalContext.futureEvents.length > 0) {
      const upcomingEvent = profile.personalContext.futureEvents[0]
      contextualInfo.push(`I remember you mentioned ${upcomingEvent.event}.`)
    }

    return contextualInfo.length > 0 ? contextualInfo.join(" ") : ""
  }

  // Generate predictive questions based on profile
  generatePredictiveQuestions(userId: string): string[] {
    const profile = this.profiles.get(userId)
    if (!profile) return []

    const questions: string[] = []

    // Questions about future events
    profile.personalContext.futureEvents.forEach((event) => {
      questions.push(`How are you feeling about ${event.event}?`)
      questions.push(`Do you need any help preparing for ${event.event}?`)
    })

    // Questions about goals
    profile.personalContext.goals.forEach((goal) => {
      questions.push(`How is your progress on ${goal}?`)
      questions.push(`What's the next step for ${goal}?`)
    })

    // Questions about challenges
    profile.personalContext.challenges.forEach((challenge) => {
      questions.push(`How are you handling ${challenge}?`)
      questions.push(`Have you found any solutions for ${challenge}?`)
    })

    // Questions about recent topics
    const recentTopics = profile.personalContext.topics
      .filter((t) => t.lastDiscussed > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) // Last 3 days
      .slice(0, 3)

    recentTopics.forEach((topic) => {
      questions.push(`How are things going with ${topic.topic}?`)
    })

    return questions.slice(0, 5) // Return top 5 questions
  }

  // Generate reminders based on stored information
  generateReminders(userId: string): string[] {
    const profile = this.profiles.get(userId)
    if (!profile) return []

    const reminders: string[] = []

    // Reminders about future events
    profile.personalContext.futureEvents.forEach((event) => {
      reminders.push(`Remember: ${event.event}`)
    })

    // Reminders about goals
    profile.personalContext.goals.forEach((goal) => {
      reminders.push(`Goal: ${goal}`)
    })

    return reminders.slice(0, 3)
  }

  // Retrieve relevant memories for context
  retrieveRelevantMemories(query: string, userId: string, limit = 5): MemoryNode[] {
    const userMemories = Array.from(this.memories.values()).filter((memory) => memory.userId === userId)

    if (userMemories.length === 0) return []

    // Simple relevance scoring based on content similarity and recency
    const scoredMemories = userMemories.map((memory) => {
      const queryWords = query.toLowerCase().split(" ")
      const contentWords = memory.content.toLowerCase().split(" ")
      const overlap = queryWords.filter((word) => contentWords.includes(word)).length

      // Score based on word overlap, importance, and recency
      const wordScore = overlap / Math.max(queryWords.length, 1)
      const importanceScore = memory.importance
      const recencyScore = 1 / (1 + (Date.now() - memory.timestamp.getTime()) / (24 * 60 * 60 * 1000)) // Decay over days

      const totalScore = wordScore * 0.4 + importanceScore * 0.3 + recencyScore * 0.3

      // Update access count
      memory.accessCount++
      memory.lastAccessed = new Date()

      return { memory, score: totalScore }
    })

    // Sort by score and return top memories
    const relevantMemories = scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.memory)

    this.saveToStorage() // Save updated access counts
    return relevantMemories
  }

  // Get conversation insights for visualization
  getConversationInsights(userId: string): {
    emotionalTrends: Array<{ emotion: string; frequency: number }>
    personalContext: ConversationProfile["personalContext"]
    hardwareOptimization: ConversationProfile["hardwareOptimization"]
    disconnectionPoints: ConversationProfile["disconnectionPoints"]
    memoryStats: {
      totalMemories: number
      recentMemories: number
      topTopics: Array<{ topic: string; frequency: number }>
    }
  } {
    const profile = this.profiles.get(userId)
    const userMemories = Array.from(this.memories.values()).filter((m) => m.userId === userId)

    if (!profile) {
      return {
        emotionalTrends: [],
        personalContext: {
          goals: [],
          challenges: [],
          preferences: [],
          relationships: [],
          futureEvents: [],
          topics: [],
        },
        hardwareOptimization: {
          preferredStates: {},
          adaptationHistory: [],
        },
        disconnectionPoints: [],
        memoryStats: {
          totalMemories: 0,
          recentMemories: 0,
          topTopics: [],
        },
      }
    }

    const recentMemories = userMemories.filter(
      (m) => m.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length

    return {
      emotionalTrends: profile.emotionalPatterns.map((p) => ({
        emotion: p.emotion,
        frequency: p.frequency,
      })),
      personalContext: profile.personalContext,
      hardwareOptimization: profile.hardwareOptimization,
      disconnectionPoints: profile.disconnectionPoints,
      memoryStats: {
        totalMemories: userMemories.length,
        recentMemories,
        topTopics: profile.personalContext.topics.slice(0, 10),
      },
    }
  }

  // Get current hardware state
  getCurrentHardwareState(): HardwareState {
    return { ...this.currentHardwareState }
  }

  // Clear all memories for a user (for privacy/reset)
  clearUserMemories(userId: string): void {
    // Remove memories
    const memoriesToDelete = Array.from(this.memories.keys()).filter((id) => this.memories.get(id)?.userId === userId)
    memoriesToDelete.forEach((id) => this.memories.delete(id))

    // Remove profile
    this.profiles.delete(userId)

    // Save changes
    this.saveToStorage()
    console.log(`Cleared all memories for user ${userId}`)
  }

  // Get memory statistics
  getMemoryStats(userId: string): {
    totalMemories: number
    emotionalBreakdown: Record<string, number>
    topTags: Array<{ tag: string; count: number }>
    memoryTimeline: Array<{ date: string; count: number }>
  } {
    const userMemories = Array.from(this.memories.values()).filter((m) => m.userId === userId)

    const emotionalBreakdown: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}
    const dailyCounts: Record<string, number> = {}

    userMemories.forEach((memory) => {
      // Emotional breakdown
      emotionalBreakdown[memory.emotion] = (emotionalBreakdown[memory.emotion] || 0) + 1

      // Tag counts
      memory.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })

      // Daily counts
      const dateKey = memory.timestamp.toISOString().split("T")[0]
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1
    })

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    const memoryTimeline = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    return {
      totalMemories: userMemories.length,
      emotionalBreakdown,
      topTags,
      memoryTimeline,
    }
  }
}
