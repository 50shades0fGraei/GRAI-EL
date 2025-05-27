"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Send, Bot, User, AlertCircle, Brain, Monitor, LogOut, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileShare } from "@/components/file-share"
import { ConversationInsights } from "@/components/conversation-insights"
import { SharedTerminal } from "@/components/shared-terminal"
import { AITerminalInterface } from "@/components/ai-terminal-interface"
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
        features: ["memory", "emotions", "files", "terminal"],
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
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
          userId: user.id, // Make sure we're sending the correct user ID
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

      // Store in memory system
      memorySystem.storeMemory(
        userMessage.content,
        data.metadata?.emotionalContext?.emotion || "neutral",
        data.metadata?.emotionalContext?.intensity || 0.5,
        user.id,
        0.7,
      )

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

  const handleAICommand = async (command: string) => {
    if (!user || !hasPermission("execute_code")) {
      console.warn("User lacks permission to execute AI commands")
      return
    }

    const aiCommandMessage = `[AI Terminal Command] ${command}`
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: aiCommandMessage,
      },
    ])

    try {
      const response = await fetch("/api/ai-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command,
          userId: user.id,
          userRole: user.role,
          context: {
            currentEmotion,
            hardwareState: memorySystem.getCurrentHardwareState(),
            sharedFiles,
          },
        }),
      })

      const data = await response.json()
      if (data.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `[AI Terminal Response] ${data.response}`,
          },
        ])
      }
    } catch (error) {
      console.error("AI command error:", error)
    }
  }

  const handleFileShare = async (file: SharedFile) => {
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
        shared_by: file.sharedBy,
      })

      setSharedFiles((prev) => {
        const existing = prev.find((f) => f.id === file.id)
        if (existing) {
          return prev.map((f) => (f.id === file.id ? file : f))
        }
        return [...prev, file]
      })

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: `[File Shared] ${file.name} (${file.type}) - ${file.content?.substring(0, 100)}...`,
        },
      ])
    } catch (error) {
      console.error("File share error:", error)
    }
  }

  const handleAITerminalAction = async (action: string, parameters: Record<string, any>): Promise<string> => {
    if (!user) return "User not authenticated"

    // Log AI action to database
    try {
      const aiAction = await db.createAIAction({
        user_id: user.id,
        action_type: action,
        parameters,
        status: "executing",
      })

      // Simulate action execution
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      const responses: Record<string, string> = {
        memory_scan: `Scanned ${Math.floor(Math.random() * 100)} memory nodes for user ${user.username}. Found ${Math.floor(Math.random() * 10)} relevant patterns.`,
        emotional_calibration: `Emotional systems calibrated for ${user.display_name || user.username}. Current state: ${currentEmotion} (${(Math.random() * 100).toFixed(1)}% intensity)`,
        hardware_optimization: `Hardware optimized for user role: ${user.role}. CPU: ${(Math.random() * 100).toFixed(1)}%, Memory: ${(Math.random() * 100).toFixed(1)}%`,
        context_analysis: `Analyzed conversation context for ${user.username}. Identified ${Math.floor(Math.random() * 5)} key themes and ${Math.floor(Math.random() * 3)} emotional transitions.`,
        predictive_modeling: `Generated predictive models for ${user.display_name || user.username} with ${(Math.random() * 100).toFixed(1)}% confidence.`,
      }

      const result = responses[action] || `Action "${action}" executed successfully for user ${user.username}.`

      // Update AI action status
      await db.updateAIAction(aiAction.id, {
        status: "completed",
        result,
        execution_time_ms: Math.floor(1000 + Math.random() * 2000),
      })

      return result
    } catch (error) {
      console.error("AI terminal action error:", error)
      return `Error executing action: ${error instanceof Error ? error.message : "Unknown error"}`
    }
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
      <div className="max-w-7xl mx-auto">
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
                  User ID: {user.id} • Last login:{" "}
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : "First time"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[85vh]">
              {/* Left Side - Chat Interface */}
              <Card className="flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-purple-600" />
                    Graei AI Chat
                    <span className="text-sm font-normal text-gray-500 ml-2">Collaborative Mode • {user.role}</span>
                  </CardTitle>
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <Monitor className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                          <p className="text-lg font-medium">Collaborative Workspace</p>
                          <p className="text-sm">
                            Hello {user.display_name || user.username}! Ready to collaborate with AI?
                          </p>
                          <p className="text-xs text-gray-400 mt-2">User ID: {user.id}</p>
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
                              className={`flex gap-3 max-w-[80%] ${
                                message.role === "user" ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  message.role === "user" ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                                }`}
                              >
                                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                              </div>
                              <div
                                className={`rounded-lg p-3 ${
                                  message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                {message.emotion && (
                                  <div className="text-xs mt-1 opacity-70">
                                    Emotion: {message.emotion} (Intensity: {message.intensity?.toFixed(1)})
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
                        placeholder={`Type your message, ${user.display_name || user.username}...`}
                        className="flex-1 min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit(e)
                          }
                        }}
                      />
                      <Button type="submit" disabled={!input.trim() || isLoadingMessage} className="self-end">
                        {isLoadingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>

              {/* Right Side - Shared Terminal and AI Interface */}
              <div className="space-y-4">
                <div className="h-[60%]">
                  <SharedTerminal onAICommand={handleAICommand} onFileShare={handleFileShare} />
                </div>
                <div className="h-[35%]">
                  <AITerminalInterface
                    onExecuteAction={handleAITerminalAction}
                    hardwareState={memorySystem.getCurrentHardwareState()}
                    currentEmotion={currentEmotion}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            {/* Simplified chat view */}
            <div className="text-center text-gray-500 py-8">
              <p>Use the Workspace tab for the full collaborative experience</p>
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

          <TabsContent value="development">
            {hasPermission("edit_system") ? (
              <FileShare onProfileImport={() => {}} onProfileExport={() => ""} onFrameworkUpdate={() => {}} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">You don't have permission to access development tools.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="memory">
            <Card>
              <CardHeader>
                <CardTitle>Memory System Status</CardTitle>
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
