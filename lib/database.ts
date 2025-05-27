import { neon } from "@neondatabase/serverless"
import { mockDb } from "./mock-database"

// Use a more robust connection approach with fallback
const getDatabaseConnection = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL

  if (!connectionString) {
    console.warn("No database connection string found. Using mock database.")
    return null
  }

  try {
    return neon(connectionString)
  } catch (error) {
    console.error("Failed to connect to database:", error)
    return null
  }
}

const sql = getDatabaseConnection()
const useMockDb = !sql

console.log("Database service initialized:", useMockDb ? "Using mock database" : "Using real database")

export interface User {
  id: string
  username: string
  email?: string
  display_name?: string
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

export interface MemoryNode {
  id: string
  user_id: string
  content: string
  emotion?: string
  intensity?: number
  importance: number
  connections: string[]
  hardware_state?: Record<string, any>
  tags: string[]
  created_at: string
  accessed_at: string
  access_count: number
}

export interface SharedFile {
  id: string
  user_id: string
  conversation_id?: string
  filename: string
  content?: string
  file_type?: string
  size_bytes?: number
  shared_by: "human" | "ai"
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
}

export class DatabaseService {
  // User Management
  async createUser(userData: {
    username: string
    email?: string
    display_name?: string
    preferences?: Record<string, any>
    emotional_baseline?: { emotion: string; intensity: number }
  }): Promise<User> {
    if (useMockDb) {
      console.log("Creating user in mock database:", userData.username)
      return await mockDb.createUser(userData)
    }

    const result = await sql!`
      INSERT INTO users (username, email, display_name, preferences, emotional_baseline)
      VALUES (
        ${userData.username},
        ${userData.email || null},
        ${userData.display_name || null},
        ${JSON.stringify(userData.preferences || {})},
        ${JSON.stringify(userData.emotional_baseline || { emotion: "content", intensity: 0.5 })}
      )
      RETURNING *
    `
    return result[0] as User
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (useMockDb) {
      console.log("Looking up user by username in mock database:", username)
      const user = await mockDb.getUserByUsername(username)
      console.log("Mock database result:", user ? `Found user ${user.id}` : "User not found")
      return user
    }

    const result = await sql!`
      SELECT * FROM users WHERE username = ${username}
    `
    return (result[0] as User) || null
  }

  async getUserById(userId: string): Promise<User | null> {
    if (useMockDb) {
      console.log("Looking up user by ID in mock database:", userId)
      const user = await mockDb.getUserById(userId)
      console.log("Mock database result:", user ? `Found user ${user.username}` : "User not found")
      return user
    }

    const result = await sql!`
      SELECT * FROM users WHERE id = ${userId}
    `
    return (result[0] as User) || null
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (useMockDb) {
      console.log("Updating user in mock database:", userId)
      return await mockDb.updateUser(userId, updates)
    }

    const setClause = Object.entries(updates)
      .filter(([key, value]) => value !== undefined)
      .map(([key, value]) => {
        if (key === "preferences" || key === "emotional_baseline") {
          return `${key} = '${JSON.stringify(value)}'`
        }
        return `${key} = '${value}'`
      })
      .join(", ")

    const result = await sql!`
      UPDATE users 
      SET ${sql!.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `
    return result[0] as User
  }

  // Conversation Management
  async createConversation(userId: string, title?: string, metadata?: Record<string, any>): Promise<Conversation> {
    if (useMockDb) {
      console.log("Creating conversation in mock database for user:", userId)
      return await mockDb.createConversation(userId, title, metadata)
    }

    const result = await sql!`
      INSERT INTO conversations (user_id, title, metadata)
      VALUES (${userId}, ${title || null}, ${JSON.stringify(metadata || {})})
      RETURNING *
    `
    return result[0] as Conversation
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    if (useMockDb) {
      return await mockDb.getConversationsByUser(userId)
    }

    const result = await sql!`
      SELECT * FROM conversations 
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `
    return result as Conversation[]
  }

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<Conversation> {
    if (useMockDb) {
      // Simple mock update
      return {
        id: conversationId,
        user_id: "mock_user",
        title: updates.title || "Updated Conversation",
        metadata: updates.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    const result = await sql!`
      UPDATE conversations 
      SET title = COALESCE(${updates.title}, title),
          metadata = COALESCE(${JSON.stringify(updates.metadata)}, metadata),
          updated_at = NOW()
      WHERE id = ${conversationId}
      RETURNING *
    `
    return result[0] as Conversation
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
    if (useMockDb) {
      console.log("Creating message in mock database for user:", messageData.user_id)
      return await mockDb.createMessage(messageData)
    }

    const result = await sql!`
      INSERT INTO messages (
        conversation_id, user_id, role, content, emotion, intensity, 
        hardware_state, metadata
      )
      VALUES (
        ${messageData.conversation_id},
        ${messageData.user_id},
        ${messageData.role},
        ${messageData.content},
        ${messageData.emotion || null},
        ${messageData.intensity || null},
        ${JSON.stringify(messageData.hardware_state || {})},
        ${JSON.stringify(messageData.metadata || {})}
      )
      RETURNING *
    `
    return result[0] as Message
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    if (useMockDb) {
      return await mockDb.getMessagesByConversation(conversationId)
    }

    const result = await sql!`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `
    return result as Message[]
  }

  // Memory Management
  async createMemoryNode(memoryData: {
    user_id: string
    content: string
    emotion?: string
    intensity?: number
    importance?: number
    connections?: string[]
    hardware_state?: Record<string, any>
    tags?: string[]
  }): Promise<MemoryNode> {
    if (useMockDb) {
      console.log("Creating memory node in mock database for user:", memoryData.user_id)
      return await mockDb.createMemoryNode(memoryData)
    }

    const result = await sql!`
      INSERT INTO memory_nodes (
        user_id, content, emotion, intensity, importance, 
        connections, hardware_state, tags
      )
      VALUES (
        ${memoryData.user_id},
        ${memoryData.content},
        ${memoryData.emotion || null},
        ${memoryData.intensity || null},
        ${memoryData.importance || 0.5},
        ${memoryData.connections || []},
        ${JSON.stringify(memoryData.hardware_state || {})},
        ${memoryData.tags || []}
      )
      RETURNING *
    `
    return result[0] as MemoryNode
  }

  async getMemoryNodesByUser(userId: string, limit = 50): Promise<MemoryNode[]> {
    if (useMockDb) {
      return await mockDb.getMemoryNodesByUser(userId, limit)
    }

    const result = await sql!`
      SELECT * FROM memory_nodes 
      WHERE user_id = ${userId}
      ORDER BY importance DESC, accessed_at DESC
      LIMIT ${limit}
    `
    return result as MemoryNode[]
  }

  async updateMemoryAccess(memoryId: string): Promise<void> {
    if (useMockDb) {
      return // No-op in mock mode
    }

    await sql!`
      UPDATE memory_nodes 
      SET accessed_at = NOW(), access_count = access_count + 1
      WHERE id = ${memoryId}
    `
  }

  // File Management
  async createSharedFile(fileData: {
    user_id: string
    conversation_id?: string
    filename: string
    content?: string
    file_type?: string
    size_bytes?: number
    shared_by: "human" | "ai"
  }): Promise<SharedFile> {
    if (useMockDb) {
      return await mockDb.createSharedFile(fileData)
    }

    const result = await sql!`
      INSERT INTO shared_files (
        user_id, conversation_id, filename, content, file_type, 
        size_bytes, shared_by
      )
      VALUES (
        ${fileData.user_id},
        ${fileData.conversation_id || null},
        ${fileData.filename},
        ${fileData.content || null},
        ${fileData.file_type || null},
        ${fileData.size_bytes || null},
        ${fileData.shared_by}
      )
      RETURNING *
    `
    return result[0] as SharedFile
  }

  async getSharedFilesByUser(userId: string): Promise<SharedFile[]> {
    if (useMockDb) {
      return await mockDb.getSharedFilesByUser(userId)
    }

    const result = await sql!`
      SELECT * FROM shared_files 
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY updated_at DESC
    `
    return result as SharedFile[]
  }

  async updateSharedFile(
    fileId: string,
    updates: {
      content?: string
      file_type?: string
      size_bytes?: number
    },
  ): Promise<SharedFile> {
    if (useMockDb) {
      return {
        id: fileId,
        user_id: "mock_user",
        filename: "mock_file.txt",
        content: updates.content || "mock content",
        file_type: updates.file_type || "text",
        size_bytes: updates.size_bytes || 100,
        shared_by: "human",
        is_active: true,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    const result = await sql!`
      UPDATE shared_files 
      SET content = COALESCE(${updates.content}, content),
          file_type = COALESCE(${updates.file_type}, file_type),
          size_bytes = COALESCE(${updates.size_bytes}, size_bytes),
          version = version + 1,
          updated_at = NOW()
      WHERE id = ${fileId}
      RETURNING *
    `
    return result[0] as SharedFile
  }

  // AI Actions
  async createAIAction(actionData: {
    user_id: string
    action_type: string
    parameters?: Record<string, any>
    status?: string
  }): Promise<any> {
    if (useMockDb) {
      return await mockDb.createAIAction(actionData)
    }

    const result = await sql!`
      INSERT INTO ai_actions (user_id, action_type, parameters, status)
      VALUES (
        ${actionData.user_id},
        ${actionData.action_type},
        ${JSON.stringify(actionData.parameters || {})},
        ${actionData.status || "pending"}
      )
      RETURNING *
    `
    return result[0]
  }

  async updateAIAction(
    actionId: string,
    updates: {
      status?: string
      result?: string
      execution_time_ms?: number
    },
  ): Promise<any> {
    if (useMockDb) {
      return await mockDb.updateAIAction(actionId, updates)
    }

    const result = await sql!`
      UPDATE ai_actions 
      SET status = COALESCE(${updates.status}, status),
          result = COALESCE(${updates.result}, result),
          execution_time_ms = COALESCE(${updates.execution_time_ms}, execution_time_ms),
          completed_at = CASE WHEN ${updates.status} IN ('completed', 'error') THEN NOW() ELSE completed_at END
      WHERE id = ${actionId}
      RETURNING *
    `
    return result[0]
  }

  // Search History
  async createSearchHistory(searchData: {
    user_id: string
    query: string
    results?: Record<string, any>
    source?: string
  }): Promise<any> {
    if (useMockDb) {
      return await mockDb.createSearchHistory(searchData)
    }

    const result = await sql!`
      INSERT INTO search_history (user_id, query, results, source)
      VALUES (
        ${searchData.user_id},
        ${searchData.query},
        ${JSON.stringify(searchData.results || {})},
        ${searchData.source || "web"}
      )
      RETURNING *
    `
    return result[0]
  }

  // Analytics
  async getEmotionalPatterns(userId: string): Promise<any[]> {
    if (useMockDb) {
      return await mockDb.getEmotionalPatterns(userId)
    }

    const result = await sql!`
      SELECT emotion, COUNT(*) as frequency, AVG(intensity) as avg_intensity
      FROM messages 
      WHERE user_id = ${userId} AND emotion IS NOT NULL
      GROUP BY emotion
      ORDER BY frequency DESC
    `
    return result
  }

  async getConversationStats(userId: string): Promise<any> {
    if (useMockDb) {
      return await mockDb.getConversationStats(userId)
    }

    const result = await sql!`
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(m.id) as total_messages,
        AVG(CASE WHEN m.role = 'assistant' THEN m.intensity END) as avg_ai_intensity,
        COUNT(DISTINCT DATE(m.created_at)) as active_days
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
    `
    return result[0]
  }

  async getUserStats(userId: string): Promise<any> {
    if (useMockDb) {
      return await mockDb.getUserStats(userId)
    }

    const result = await sql!`
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(DISTINCT m.id) as total_messages,
        COUNT(DISTINCT sf.id) as shared_files_count,
        COUNT(DISTINCT aa.id) as ai_actions_count,
        COUNT(DISTINCT mn.id) as memory_nodes_count,
        MAX(GREATEST(
          c.updated_at,
          m.created_at,
          sf.updated_at,
          aa.created_at,
          mn.created_at
        )) as last_activity
      FROM users u
      LEFT JOIN conversations c ON u.id = c.user_id
      LEFT JOIN messages m ON u.id = m.user_id
      LEFT JOIN shared_files sf ON u.id = sf.user_id
      LEFT JOIN ai_actions aa ON u.id = aa.user_id
      LEFT JOIN memory_nodes mn ON u.id = mn.user_id
      WHERE u.id = ${userId}
      GROUP BY u.id
    `

    return (
      result[0] || {
        total_conversations: 0,
        total_messages: 0,
        shared_files_count: 0,
        ai_actions_count: 0,
        memory_nodes_count: 0,
        last_activity: null,
      }
    )
  }
}

export const db = new DatabaseService()
