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

console.log("Auth service initialized:", useMockDb ? "Using mock database" : "Using real database")

export interface AuthUser {
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

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
  last_accessed: string
  user_agent?: string
  ip_address?: string
}

export interface UserPreference {
  id: string
  user_id: string
  category: string
  key: string
  value: any
  created_at: string
  updated_at: string
}

export class AuthService {
  // User Authentication
  async authenticateUser(username: string): Promise<AuthUser | null> {
    try {
      console.log("AuthService: Authenticating user:", username)

      if (useMockDb) {
        console.log("AuthService: Using mock database")
        const user = await mockDb.getUserByUsername(username)

        if (user) {
          console.log("AuthService: Found user in mock DB:", user.id, user.username)
          // Update last login and return the updated user
          const updatedUser = await mockDb.updateUser(user.id, {
            last_login: new Date().toISOString(),
          })
          console.log("AuthService: Updated user last login:", updatedUser.id)
          return updatedUser
        }

        console.log("AuthService: User not found in mock database:", username)
        return null
      }

      const result = await sql!`
        UPDATE users 
        SET last_login = NOW()
        WHERE username = ${username} AND is_active = true
        RETURNING *
      `

      if (result.length === 0) {
        return null
      }

      return result[0] as AuthUser
    } catch (error) {
      console.error("AuthService: Authentication error:", error)
      return null
    }
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      console.log("AuthService: Getting user by ID:", userId)

      if (useMockDb) {
        const user = await mockDb.getUserById(userId)
        console.log("AuthService: Mock DB getUserById result:", user ? `Found ${user.username}` : "Not found")
        return user
      }

      const result = await sql!`
        SELECT * FROM users WHERE id = ${userId} AND is_active = true
      `

      return (result[0] as AuthUser) || null
    } catch (error) {
      console.error("AuthService: Get user error:", error)
      return null
    }
  }

  async getUserByToken(authToken: string): Promise<AuthUser | null> {
    try {
      if (useMockDb) {
        // Simple token lookup in mock mode
        const users = Array.from((mockDb as any).users.values())
        return users.find((user: any) => user.auth_token === authToken) || null
      }

      const result = await sql!`
        SELECT * FROM users WHERE auth_token = ${authToken} AND is_active = true
      `

      return (result[0] as AuthUser) || null
    } catch (error) {
      console.error("Get user by token error:", error)
      return null
    }
  }

  // Session Management (simplified for mock mode)
  async createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<UserSession> {
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    console.log("AuthService: Creating session for user:", userId)

    if (useMockDb) {
      const session = {
        id: `session_${Date.now()}`,
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        user_agent: userAgent || "Unknown",
        ip_address: ipAddress || "Unknown",
      }
      console.log("AuthService: Mock session created:", session.id)
      return session
    }

    const result = await sql!`
      INSERT INTO user_sessions (user_id, session_token, expires_at, user_agent, ip_address)
      VALUES (${userId}, ${sessionToken}, ${expiresAt.toISOString()}, ${userAgent || "Unknown"}, ${ipAddress || "Unknown"})
      RETURNING *
    `

    return result[0] as UserSession
  }

  async validateSession(sessionToken: string): Promise<{ user: AuthUser; session: UserSession } | null> {
    try {
      console.log("AuthService: Validating session token")

      if (useMockDb) {
        // Simple session validation for mock mode
        console.log("AuthService: Mock session validation")
        const user = await mockDb.getUserByUsername("developer") // Default to developer user

        if (user) {
          console.log("AuthService: Session validated for user:", user.id, user.username)
          const session: UserSession = {
            id: "mock_session",
            user_id: user.id,
            session_token: sessionToken,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
          }
          return { user, session }
        }

        console.log("AuthService: No user found for session validation")
        return null
      }

      const result = await sql!`
        SELECT 
          s.*,
          u.id as user_id,
          u.username,
          u.email,
          u.display_name,
          u.role,
          u.auth_token,
          u.last_login,
          u.is_active,
          u.preferences,
          u.emotional_baseline,
          u.created_at as user_created_at,
          u.updated_at as user_updated_at
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken} 
          AND s.expires_at > NOW()
          AND u.is_active = true
      `

      if (result.length === 0) {
        return null
      }

      const row = result[0]

      // Update last accessed
      await sql!`
        UPDATE user_sessions 
        SET last_accessed = NOW()
        WHERE session_token = ${sessionToken}
      `

      const user: AuthUser = {
        id: row.user_id,
        username: row.username,
        email: row.email,
        display_name: row.display_name,
        role: row.role,
        auth_token: row.auth_token,
        last_login: row.last_login,
        is_active: row.is_active,
        preferences: row.preferences,
        emotional_baseline: row.emotional_baseline,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      }

      const session: UserSession = {
        id: row.id,
        user_id: row.user_id,
        session_token: row.session_token,
        expires_at: row.expires_at,
        created_at: row.created_at,
        last_accessed: row.last_accessed,
        user_agent: row.user_agent,
        ip_address: row.ip_address,
      }

      return { user, session }
    } catch (error) {
      console.error("AuthService: Session validation error:", error)
      return null
    }
  }

  async revokeSession(sessionToken: string): Promise<boolean> {
    try {
      if (useMockDb) {
        return true // Always succeed in mock mode
      }

      const result = await sql!`
        DELETE FROM user_sessions WHERE session_token = ${sessionToken}
      `
      return result.length > 0
    } catch (error) {
      console.error("Session revocation error:", error)
      return false
    }
  }

  // User Preferences (simplified for mock mode)
  async getUserPreferences(userId: string, category?: string): Promise<UserPreference[]> {
    if (useMockDb) {
      return [] // Return empty array in mock mode
    }

    try {
      if (category) {
        const result = await sql!`
          SELECT * FROM user_preferences 
          WHERE user_id = ${userId} AND category = ${category}
          ORDER BY key
        `
        return result as UserPreference[]
      } else {
        const result = await sql!`
          SELECT * FROM user_preferences 
          WHERE user_id = ${userId}
          ORDER BY category, key
        `
        return result as UserPreference[]
      }
    } catch (error) {
      console.error("Get preferences error:", error)
      return []
    }
  }

  async setUserPreference(userId: string, category: string, key: string, value: any): Promise<UserPreference> {
    if (useMockDb) {
      return {
        id: `pref_${Date.now()}`,
        user_id: userId,
        category,
        key,
        value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    const result = await sql!`
      INSERT INTO user_preferences (user_id, category, key, value)
      VALUES (${userId}, ${category}, ${key}, ${JSON.stringify(value)})
      ON CONFLICT (user_id, category, key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = NOW()
      RETURNING *
    `

    return result[0] as UserPreference
  }

  // Role-based permissions
  hasPermission(user: AuthUser, permission: string): boolean {
    const rolePermissions: Record<string, string[]> = {
      user: ["read_own_data", "create_conversations", "upload_files"],
      developer: [
        "read_own_data",
        "create_conversations",
        "upload_files",
        "edit_system",
        "view_all_users",
        "manage_ai",
        "access_admin_panel",
        "execute_code",
        "web_search",
      ],
      admin: [
        "read_own_data",
        "create_conversations",
        "upload_files",
        "edit_system",
        "view_all_users",
        "manage_ai",
        "access_admin_panel",
        "execute_code",
        "web_search",
        "manage_users",
        "view_analytics",
      ],
      super_admin: ["*"], // All permissions
    }

    const userPermissions = rolePermissions[user.role] || []
    return userPermissions.includes("*") || userPermissions.includes(permission)
  }

  // Update user profile
  async updateUserProfile(
    userId: string,
    updates: {
      display_name?: string
      email?: string
      preferences?: Record<string, any>
      emotional_baseline?: { emotion: string; intensity: number }
    },
  ): Promise<AuthUser> {
    if (useMockDb) {
      return await mockDb.updateUser(userId, updates)
    }

    const result = await sql!`
      UPDATE users 
      SET 
        display_name = COALESCE(${updates.display_name}, display_name),
        email = COALESCE(${updates.email}, email),
        preferences = COALESCE(${JSON.stringify(updates.preferences)}, preferences),
        emotional_baseline = COALESCE(${JSON.stringify(updates.emotional_baseline)}, emotional_baseline),
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `

    return result[0] as AuthUser
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    total_conversations: number
    total_messages: number
    shared_files_count: number
    ai_actions_count: number
    memory_nodes_count: number
    last_activity: string | null
  }> {
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

export const authService = new AuthService()
