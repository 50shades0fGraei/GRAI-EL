"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Send,
  Bot,
  User,
  AlertCircle,
  Brain,
  Monitor,
  LogOut,
  Settings,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ConversationInsights } from "@/components/conversation-insights"
import { IntegratedWorkspace } from "@/components/integrated-workspace"
import { UserProfile } from "@/components/user-profile"
import { UserProvider, useUser } from "@/components/user-context"
import { MemoryRetentionSystem } from "@/lib/memory-retention"
import { db } from "@/lib/database"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  emotion?: string
  intensity?: number
  hasSearchAction?: boolean
  searchQuery?: string
}

interface SharedFile {
  id: string
  name: string
  content: string
  type: "text" | "code" | "json" | "markdown"
  lastModified: Date
  sharedBy: "human" | "ai"
}

function GraeiAIContent() {
  const { user, isLoading, logout, hasPermission } = useUser()
  const [isMounted, setIsMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memorySystem] = useState(() => new MemoryRetentionSystem())
  const [insights, setInsights] = useState<any>(null)
  const [predictiveQuestions, setPredictiveQuestions] = useState<string[]>([])
  const [reminders, setReminders] = useState<string[]>([])
  const [currentEmotion, setCurrentEmotion] = useState("content")
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [currentConversation, setCurrentConversation] = useState<any>(null)
  const [conversationInterval, setConversationInterval] = useState<NodeJS.Timeout | null>(null)
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(false)

  // Add this useEffect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      console.log("User loaded, initializing conversation for:", user.id, user.username)
      initializeConversation()
      updateInsights()
      const intervalId = setInterval(updateInsights, 5000)
      setConversationInterval(intervalId)
      return () => clearInterval(intervalId)
    }

    return () => {
      if (conversationInterval) {
        clearInterval(conversationInterval)
        setConversationInterval(null)
      }
    }
  }, [user])

  // Add this early return for server-side rendering
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-lg font-medium">Loading Graei AI...</p>
        </div>
      </div>
    )
  }

  const initializeConversation = async () => {
    if (!user) {
      console.log("No user available for conversation initialization")
      return
    }

    try {
      console.log("Initializing conversation for user:", user.id)
      // Create or get current conversation
      const conversation = await db.createConversation(user.id, "Graei AI Session", {
        session_type: "collaborative",
        features: ["memory", "emotions", "files", "browser", "editor"],
      })
      console.log("Conversation created:", conversation.id)
      setCurrentConversation(conversation)

      // Load existing messages
      const existingMessages = await db.getMessagesByConversation(conversation.id)
      const formattedMessages = existingMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        emotion: msg.emotion,
        intensity: msg.intensity,
      }))
      setMessages(formattedMessages)
      console.log("Loaded", formattedMessages.length, "existing messages")
    } catch (error) {
      console.error("Failed to initialize conversation:", error)
    }
  }

  const updateInsights = () => {
    if (!user) return

    const newInsights = memorySystem.getConversationInsights(user.id)
    setInsights(newInsights)
    setPredictiveQuestions(memorySystem.generatePredictiveQuestions(user.id))
    setReminders(memorySystem.generateReminders(user.id))
  }

  const clearMemories = () => {
    if (!user) return

    if (confirm("Are you sure you want to clear all memories? This action cannot be undone.")) {
      memorySystem.clearUserMemories(user.id)
      updateInsights()
      setMessages([])
      console.log("All memories cleared for user:", user.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoadingMessage || !user) {
      console.log("Submit blocked:", {
        hasInput: !!input.trim(),
        isLoading: isLoadingMessage,
        hasUser: !!user,
      })
      return
    }

    console.log("=== SUBMITTING MESSAGE ===")
    console.log("User:", user.id, user.username, user.role)
    console.log("Conversation:", currentConversation?.id)

    // Check if message contains search intent
    const searchKeywords = ["search", "find", "look up", "research", "google", "browse"]
    const hasSearchIntent = searchKeywords.some((keyword) => input.toLowerCase().includes(keyword))

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      hasSearchAction: hasSearchIntent,
      searchQuery: hasSearchIntent ? input : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoadingMessage(true)
    setError(null)

    try {
      // Save user message to database if conversation exists
      if (currentConversation) {
        await db.createMessage({
          conversation_id: currentConversation.id,
          user_id: user.id,
          role: "user",
          content: userMessage.content,
          metadata: { timestamp: new Date().toISOString() },
        })
        console.log("✅ User message saved to database")
      }

      console.log("Making API request with user ID:", user.id)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: user.id,
          conversationId: currentConversation?.id,
          userRole: user.role,
          sharedFiles: sharedFiles,
        }),
      })

      console.log("API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("API response data:", data)

      if (!data.content) {
        throw new Error("No content in response")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        emotion: data.metadata?.emotionalContext?.emotion,
        intensity: data.metadata?.emotionalContext?.intensity,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setCurrentEmotion(data.metadata?.emotionalContext?.emotion || "content")

      // Save assistant message to database
      if (currentConversation) {
        await db.createMessage({
          conversation_id: currentConversation.id,
          user_id: user.id,
          role: "assistant",
          content: assistantMessage.content,
          emotion: assistantMessage.emotion,
          intensity: assistantMessage.intensity,
          hardware_state: data.metadata?.hardwareState,
          metadata: data.metadata || {},
        })
        console.log("✅ Assistant message saved to database")
      }

      // Update insights after new message
      setTimeout(updateInsights, 1000)

      console.log("=== MESSAGE PROCESSING COMPLETE ===")
    } catch (error) {
      console.error("=== MESSAGE PROCESSING ERROR ===", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(errorMessage)

      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
      }
      setMessages((prev) => [...prev, errorAssistantMessage])
    } finally {
      setIsLoadingMessage(false)
    }
  }

  const handleContentShare = (content: string, source: string, type: "browser" | "file") => {
    // Share content with the conversation
    const icon = type === "browser" ? "🌐" : "📄"
    const shareMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `${icon} **Shared ${type === "browser" ? "from" : "file"}:** ${source}\n\n${content.substring(0, 500)}${content.length > 500 ? "..." : ""}`,
    }
    setMessages((prev) => [...prev, shareMessage])
  }

  const handleFileShare = async (file: any) => {
    if (!user || !currentConversation) return

    try {
      // Save to database
      await db.createSharedFile({
        user_id: user.id,
        conversation_id: currentConversation.id,
        filename: file.name,
        content: file.content,
        file_type: file.type,
        size_bytes: file.content?.length || 0,
        shared_by: file.sharedBy || file.lastModifiedBy === "ai" ? "ai" : "human",
      })

      setSharedFiles((prev) => {
        const existing = prev.find((f) => f.id === file.id)
        if (existing) {
          return prev.map((f) => (f.id === file.id ? file : f))
        }
        return [...prev, file]
      })

      // Don't automatically add to chat - let the workspace handle it
    } catch (error) {
      console.error("File share error:", error)
    }
  }

  const handleAIAssist = async (file: any, request: string) => {
    // Handle AI assistance request for files
    const assistMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `🤖 **AI Assist Request for ${file.name}:** ${request}`,
    }
    setMessages((prev) => [...prev, assistMessage])

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I can help you with ${file.name}! Based on your request "${request}", here are my suggestions:\n\n• Review the code structure for improvements\n• Consider adding error handling\n• Add documentation for better maintainability\n• Test the functionality thoroughly\n\nWould you like me to help implement any of these suggestions?`,
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1500)
  }

  const handleSearchRequest = (query: string) => {
    // Add a message indicating search is happening
    const searchMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `🔍 Searching for "${query}" in the browser workspace...`,
    }
    setMessages((prev) => [...prev, searchMessage])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-lg font-medium">Loading Graei AI...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Welcome to Graei AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Authentication required</p>
              <p className="text-sm mt-2">Please refresh the page to authenticate</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header with user info */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {user.display_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">Welcome back, {user.display_name || user.username}!</h1>
              <div className="flex items-center gap-2">
                <Badge className={`${user.role === "developer" ? "bg-purple-500" : "bg-blue-500"} text-white`}>
                  {user.role.replace("_", " ").toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  Memories: {insights?.memoryStats?.totalMemories || 0} • Files: {sharedFiles.length}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearMemories}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Memory
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="workspace" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="space-y-4">
            <div className="h-[85vh] flex gap-4">
              {/* Chat Interface - Flexible width */}
              <div className={`transition-all duration-300 ${workspaceCollapsed ? "flex-1" : "flex-[2]"}`}>
                <Card className="h-full flex flex-col">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-6 w-6 text-purple-600" />
                      Graei AI Chat
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        Collaborative Workspace • {insights?.memoryStats?.totalMemories || 0} memories
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setWorkspaceCollapsed(!workspaceCollapsed)}
                      >
                        {workspaceCollapsed ? (
                          <ChevronLeft className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CardTitle>
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {predictiveQuestions.length > 0 && (
                      <div className="text-sm text-purple-600">
                        <strong>Suggested:</strong> {predictiveQuestions[0]}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 p-4">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <Monitor className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                            <p className="text-lg font-medium">Collaborative AI Workspace</p>
                            <p className="text-sm">
                              Hello {user.display_name || user.username}! I can help you with conversations, and you can
                              use the workspace tools on the right for browsing and file editing.
                            </p>
                            {insights?.memoryStats?.totalMemories > 0 && (
                              <p className="text-xs text-gray-400 mt-2">
                                I have {insights.memoryStats.totalMemories} memories about you
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`flex gap-3 max-w-[85%] ${
                                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    message.role === "user" ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                                  }`}
                                >
                                  {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div
                                  className={`rounded-lg p-3 break-words ${
                                    message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                  {message.emotion && (
                                    <div className="text-xs mt-1 opacity-70">
                                      Emotion: {message.emotion} (Intensity: {message.intensity?.toFixed(1)})
                                    </div>
                                  )}
                                  {message.hasSearchAction && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // This would trigger search in workspace
                                          console.log("Search action:", message.searchQuery)
                                        }}
                                      >
                                        <Search className="h-4 w-4 mr-1" />
                                        Search in Browser
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {isLoadingMessage && (
                            <div className="flex gap-3 justify-start">
                              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                                <Bot className="h-4 w-4" />
                              </div>
                              <div className="bg-gray-100 rounded-lg p-3">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>

                    <div className="border-t p-4">
                      <form onSubmit={handleSubmit} className="flex gap-2">
                        <Textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={`Chat with me, ${user.display_name || user.username}! Use the workspace tools ${workspaceCollapsed ? "(click arrow to expand)" : "on the right"} for browsing and file editing.`}
                          className="flex-1 min-h-[60px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSubmit(e)
                            }
                          }}
                        />
                        <Button type="submit" disabled={!input.trim() || isLoadingMessage} className="self-end">
                          {isLoadingMessage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Integrated Workspace - Collapsible */}
              {!workspaceCollapsed && (
                <div className="flex-1 min-w-[400px]">
                  <IntegratedWorkspace
                    onFileShare={handleFileShare}
                    onContentShare={handleContentShare}
                    onAIAssist={handleAIAssist}
                    onSearchRequest={handleSearchRequest}
                    sharedFiles={sharedFiles}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            {insights && (
              <ConversationInsights insights={insights} currentHardwareState={memorySystem.getCurrentHardwareState()} />
            )}
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>

          <TabsContent value="memory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Memory System Status
                  <Button variant="outline" size="sm" onClick={clearMemories}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <strong>User:</strong> {user.display_name || user.username} ({user.role})
                  </div>
                  <div className="text-sm">
                    <strong>User ID:</strong> {user.id}
                  </div>
                  <div className="text-sm">
                    <strong>Total Memories:</strong> {insights?.memoryStats?.totalMemories || 0}
                  </div>
                  <div className="text-sm">
                    <strong>Recent Memories (7 days):</strong> {insights?.memoryStats?.recentMemories || 0}
                  </div>
                  <div className="text-sm">
                    <strong>Active Topics:</strong> {insights?.memoryStats?.topTopics?.length || 0}
                  </div>
                  <div className="text-sm">
                    <strong>Total Messages:</strong> {messages.length}
                  </div>
                  <div className="text-sm">
                    <strong>Shared Files:</strong> {sharedFiles.length}
                  </div>
                  <div className="text-sm">
                    <strong>Current Emotion:</strong> {currentEmotion}
                  </div>
                  <div className="text-sm">
                    <strong>Conversation ID:</strong> {currentConversation?.id || "Not initialized"}
                  </div>

                  {reminders.length > 0 && (
                    <div className="mt-4">
                      <strong className="text-sm">Reminders:</strong>
                      <ul className="text-sm text-gray-600 mt-1">
                        {reminders.map((reminder, index) => (
                          <li key={index}>• {reminder}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function GraeiAI() {
  return (
    <UserProvider>
      <GraeiAIContent />
    </UserProvider>
  )
}
