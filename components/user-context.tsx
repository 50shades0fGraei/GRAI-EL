"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService, type AuthUser } from "@/lib/auth-service"

interface UserContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (username: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: string) => boolean
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      initializeUser()
    }
  }, [])

  const initializeUser = async () => {
    try {
      setIsLoading(true)
      console.log("Initializing user...")

      // Check localStorage for session token
      const sessionToken = localStorage.getItem("graei_session_token")
      console.log("Session token from localStorage:", sessionToken ? "exists" : "not found")

      if (sessionToken) {
        console.log("Validating existing session...")
        const sessionData = await authService.validateSession(sessionToken)
        if (sessionData) {
          console.log("Session valid, user:", sessionData.user.id, sessionData.user.username)
          setUser(sessionData.user)
          return
        } else {
          console.log("Session invalid, removing token")
          localStorage.removeItem("graei_session_token")
        }
      }

      // Auto-login as developer for now (in production, you'd have proper auth)
      console.log("Attempting auto-login as developer...")
      const devUser = await authService.authenticateUser("developer")

      if (devUser) {
        console.log("Developer user authenticated:", devUser.id, devUser.username, devUser.role)
        setUser(devUser)

        // Create a session with safe user agent detection
        const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Server"
        console.log("Creating session for user:", devUser.id)

        const session = await authService.createSession(
          devUser.id,
          userAgent,
          "127.0.0.1", // In production, get real IP
        )

        console.log("Session created:", session.session_token)
        localStorage.setItem("graei_session_token", session.session_token)
      } else {
        console.error("Failed to authenticate developer user")
      }
    } catch (error) {
      console.error("User initialization error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log("Login attempt for username:", username)

      const authUser = await authService.authenticateUser(username)

      if (authUser) {
        console.log("User authenticated:", authUser.id, authUser.username)
        setUser(authUser)

        // Create session with safe user agent detection
        const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Server"
        const session = await authService.createSession(authUser.id, userAgent, "127.0.0.1")
        localStorage.setItem("graei_session_token", session.session_token)

        return true
      }

      console.log("Authentication failed for username:", username)
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem("graei_session_token")
      if (sessionToken) {
        await authService.revokeSession(sessionToken)
        localStorage.removeItem("graei_session_token")
      }
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return authService.hasPermission(user, permission)
  }

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return

    try {
      const updatedUser = await authService.updateUserProfile(user.id, updates)
      setUser(updatedUser)
    } catch (error) {
      console.error("Profile update error:", error)
    }
  }

  const refreshUser = async () => {
    if (!user) return

    try {
      const refreshedUser = await authService.getUserById(user.id)
      if (refreshedUser) {
        setUser(refreshedUser)
      }
    } catch (error) {
      console.error("User refresh error:", error)
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        hasPermission,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
