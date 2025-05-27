// Mock database service for development when Neon is not connected
import { generateUUID } from "./uuid-utils"

export interface User {
  id: string
  username: string
  email?: string
  display_name?: string
  role: "user" | "developer" | "admin" | "super_admin"
  auth_token?: string
  last_login?: string
  is_active: boolean
  preferences: Record<string, any>
  emotional_baseline: {
    emotion: string
    intensity: number
  }
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  role: "user" | "assistant" | "system"
  content: string
  emotion?: string
  intensity?: number
  hardware_state?: Record<string, any>
  metadata: Record<string, any>
  created_at: string
}

export class MockDatabaseService {
  private users: Map<string, User> = new Map()
  private conversations: Map<string, Conversation> = new Map()
  private messages: Map<string, Message> = new Map()
  private memoryNodes: Map<string, any> = new Map()
  private sharedFiles: Map<string, any> = new Map()
  private aiActions: Map<string, any> = new Map()

  constructor() {
    this.initializeMockData()
  }

  private initializeMockData() {
    // Create a default developer user with proper UUID
    const developerId = generateUUID()
    const developerUser: User = {
      id: developerId,
      username: "developer",
      email: "developer@graei.ai",
      display_name: "Developer",
      role: "developer",
      auth_token: `dev_token_${generateUUID()}`,
      last_login: new Date().toISOString(),
      is_active: true,
      preferences: {
        theme: "dark",
        language: "en",
        notifications: true,
        role_permissions: {
          can_edit_system: true,
          can_view_all_users: true,
          can_manage_ai: true,
          can_access_admin_panel: true,
        },
      },
      emotional_baseline: {
        emotion: "content",
        intensity: 0.7,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Store by both ID and username for easy lookup
    this.users.set(developerId, developerUser)
    this.users.set("developer", developerUser)

    // Also store a reference mapping for username to ID
    this.users.set("username:developer", developerUser)
  }

  // User Management
  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null
  }

  async getUserByUsername(username: string): Promise<User | null> {
    // Try direct username lookup first
    let user = this.users.get(username)
    if (user) return user

    // Try with username prefix
    user = this.users.get(`username:${username}`)
    if (user) return user

    // Fallback: search through all users
    for (const [key, value] of this.users.entries()) {
      if (value.username === username) {
        return value
      }
    }

    return null
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const userId = generateUUID()
    const user: User = {
      id: userId,
      username: userData.username || `user_${Date.now()}`,
      email: userData.email,
      display_name: userData.display_name,
      role: userData.role || "user",
      auth_token: `token_${generateUUID()}`,
      last_login: new Date().toISOString(),
      is_active: true,
      preferences: userData.preferences || {},
      emotional_baseline: userData.emotional_baseline || { emotion: "content", intensity: 0.5 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.users.set(userId, user)
    this.users.set(user.username, user)
    return user
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const existingUser = this.users.get(userId)
    if (!existingUser) {
      throw new Error("User not found")
    }

    const updatedUser = {
      ...existingUser,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Update in all storage locations
    this.users.set(userId, updatedUser)
    this.users.set(updatedUser.username, updatedUser)
    this.users.set(`username:${updatedUser.username}`, updatedUser)

    return updatedUser
  }

  // Conversation Management
  async createConversation(userId: string, title?: string, metadata?: Record<string, any>): Promise<Conversation> {
    const conversationId = generateUUID()
    const conversation: Conversation = {
      id: conversationId,
      user_id: userId,
      title: title || "New Conversation",
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.conversations.set(conversationId, conversation)
    return conversation
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter((conv) => conv.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }

  // Message Management
  async createMessage(messageData: {
    conversation_id: string
    user_id: string
    role: "user" | "assistant" | "system"
    content: string
    emotion?: string
    intensity?: number
    hardware_state?: Record<string, any>
    metadata?: Record<string, any>
  }): Promise<Message> {
    const messageId = generateUUID()
    const message: Message = {
      id: messageId,
      conversation_id: messageData.conversation_id,
      user_id: messageData.user_id,
      role: messageData.role,
      content: messageData.content,
      emotion: messageData.emotion,
      intensity: messageData.intensity,
      hardware_state: messageData.hardware_state || {},
      metadata: messageData.metadata || {},
      created_at: new Date().toISOString(),
    }

    this.messages.set(messageId, message)
    return message
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  // Memory Management
  async createMemoryNode(memoryData: any): Promise<any> {
    const memoryId = generateUUID()
    const memory = {
      id: memoryId,
      ...memoryData,
      created_at: new Date().toISOString(),
      accessed_at: new Date().toISOString(),
      access_count: 0,
    }

    this.memoryNodes.set(memoryId, memory)
    return memory
  }

  async getMemoryNodesByUser(userId: string, limit = 50): Promise<any[]> {
    return Array.from(this.memoryNodes.values())
      .filter((memory) => memory.user_id === userId)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit)
  }

  // File Management
  async createSharedFile(fileData: any): Promise<any> {
    const fileId = generateUUID()
    const file = {
      id: fileId,
      ...fileData,
      is_active: true,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.sharedFiles.set(fileId, file)
    return file
  }

  async getSharedFilesByUser(userId: string): Promise<any[]> {
    return Array.from(this.sharedFiles.values())
      .filter((file) => file.user_id === userId && file.is_active)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }

  // AI Actions
  async createAIAction(actionData: any): Promise<any> {
    const actionId = generateUUID()
    const action = {
      id: actionId,
      ...actionData,
      created_at: new Date().toISOString(),
    }

    this.aiActions.set(actionId, action)
    return action
  }

  async updateAIAction(actionId: string, updates: any): Promise<any> {
    const existingAction = this.aiActions.get(actionId)
    if (!existingAction) {
      throw new Error("AI Action not found")
    }

    const updatedAction = {
      ...existingAction,
      ...updates,
      completed_at:
        updates.status === "completed" || updates.status === "error"
          ? new Date().toISOString()
          : existingAction.completed_at,
    }

    this.aiActions.set(actionId, updatedAction)
    return updatedAction
  }

  // Search History
  async createSearchHistory(searchData: any): Promise<any> {
    const searchId = generateUUID()
    return {
      id: searchId,
      ...searchData,
      created_at: new Date().toISOString(),
    }
  }

  // Analytics and Stats
  async getUserStats(userId: string): Promise<any> {
    const userConversations = Array.from(this.conversations.values()).filter((c) => c.user_id === userId)
    const userMessages = Array.from(this.messages.values()).filter((m) => m.user_id === userId)
    const userFiles = Array.from(this.sharedFiles.values()).filter((f) => f.user_id === userId)
    const userActions = Array.from(this.aiActions.values()).filter((a) => a.user_id === userId)
    const userMemories = Array.from(this.memoryNodes.values()).filter((m) => m.user_id === userId)

    const lastActivity = Math.max(
      ...userConversations.map((c) => new Date(c.updated_at).getTime()),
      ...userMessages.map((m) => new Date(m.created_at).getTime()),
      ...userFiles.map((f) => new Date(f.updated_at).getTime()),
      ...userActions.map((a) => new Date(a.created_at).getTime()),
      ...userMemories.map((m) => new Date(m.created_at).getTime()),
    )

    return {
      total_conversations: userConversations.length,
      total_messages: userMessages.length,
      shared_files_count: userFiles.length,
      ai_actions_count: userActions.length,
      memory_nodes_count: userMemories.length,
      last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
    }
  }

  async getEmotionalPatterns(userId: string): Promise<any[]> {
    const userMessages = Array.from(this.messages.values()).filter((m) => m.user_id === userId && m.emotion)

    const emotionCounts: Record<string, { count: number; totalIntensity: number }> = {}

    userMessages.forEach((msg) => {
      if (msg.emotion) {
        if (!emotionCounts[msg.emotion]) {
          emotionCounts[msg.emotion] = { count: 0, totalIntensity: 0 }
        }
        emotionCounts[msg.emotion].count++
        emotionCounts[msg.emotion].totalIntensity += msg.intensity || 0
      }
    })

    return Object.entries(emotionCounts).map(([emotion, data]) => ({
      emotion,
      frequency: data.count,
      avg_intensity: data.totalIntensity / data.count,
    }))
  }

  async getConversationStats(userId: string): Promise<any> {
    const userConversations = Array.from(this.conversations.values()).filter((c) => c.user_id === userId)
    const userMessages = Array.from(this.messages.values()).filter((m) => m.user_id === userId)
    const assistantMessages = userMessages.filter((m) => m.role === "assistant" && m.intensity)

    const avgIntensity =
      assistantMessages.length > 0
        ? assistantMessages.reduce((sum, msg) => sum + (msg.intensity || 0), 0) / assistantMessages.length
        : 0

    const uniqueDays = new Set(userMessages.map((m) => new Date(m.created_at).toDateString())).size

    return {
      total_conversations: userConversations.length,
      total_messages: userMessages.length,
      avg_ai_intensity: avgIntensity,
      active_days: uniqueDays,
    }
  }
}

export const mockDb = new MockDatabaseService()
