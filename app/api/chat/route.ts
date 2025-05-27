import { type NextRequest, NextResponse } from "next/server"
import { GraeiCore } from "@/lib/graei-core"
import { db } from "@/lib/database"

const graeiCore = new GraeiCore()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userId, conversationId, userRole, sharedFiles } = body

    console.log("=== CHAT API REQUEST ===")
    console.log("User ID:", userId, "(type:", typeof userId, ")")
    console.log("User Role:", userRole)
    console.log("Conversation ID:", conversationId)

    // Enhanced user lookup with multiple fallback strategies
    let user = null

    // Strategy 1: Direct ID lookup
    if (userId) {
      console.log("Strategy 1: Looking up user by ID:", userId)
      user = await db.getUserById(userId)
      if (user) {
        console.log("✅ Found user by ID:", user.username, user.role)
      } else {
        console.log("❌ User not found by ID")
      }
    }

    // Strategy 2: Username fallback (if userId looks like a username)
    if (!user && typeof userId === "string") {
      console.log("Strategy 2: Trying username lookup:", userId)
      user = await db.getUserByUsername(userId)
      if (user) {
        console.log("✅ Found user by username:", user.id, user.username)
      } else {
        console.log("❌ User not found by username")
      }
    }

    // Strategy 3: Default developer user fallback
    if (!user) {
      console.log("Strategy 3: Falling back to default developer user")
      user = await db.getUserByUsername("developer")
      if (user) {
        console.log("✅ Found default developer user:", user.id, user.username)
      } else {
        console.log("❌ Default developer user not found")
      }
    }

    // Strategy 4: Create developer user if none exists
    if (!user) {
      console.log("Strategy 4: Creating new developer user")
      try {
        user = await db.createUser({
          username: "developer",
          email: "developer@graei.ai",
          display_name: "Developer",
          preferences: {
            theme: "dark",
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
        })
        console.log("✅ Created new developer user:", user.id, user.username)
      } catch (createError) {
        console.error("❌ Failed to create developer user:", createError)
      }
    }

    // Final check
    if (!user) {
      console.error("=== ALL USER LOOKUP STRATEGIES FAILED ===")
      return NextResponse.json(
        {
          error: "Unable to authenticate user. Please refresh the page.",
          debug: {
            requestedUserId: userId,
            userIdType: typeof userId,
            strategiesAttempted: ["byId", "byUsername", "defaultDeveloper", "createNew"],
          },
        },
        { status: 401 },
      )
    }

    console.log("=== USER AUTHENTICATED ===")
    console.log("Final user:", user.id, user.username, user.role)

    const nvidiaApiKey = "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"

    if (!nvidiaApiKey) {
      console.error("NVIDIA API key not found")
      return NextResponse.json({ error: "NVIDIA API key not configured" }, { status: 500 })
    }

    const latestMessage = messages[messages.length - 1]?.content || ""

    // Create system prompt based on user role and context
    const systemPrompt = `You are Graei, an emotionally intelligent AI assistant working with ${user.display_name || user.username} (${user.role}). 

User Context:
- Role: ${user.role} 
- Display Name: ${user.display_name || user.username}
- Emotional Baseline: ${user.emotional_baseline.emotion} (${user.emotional_baseline.intensity})
- Shared Files: ${sharedFiles?.length || 0} files available
- Conversation ID: ${conversationId}

As a ${user.role}, this user has specific permissions and expertise. Tailor your responses accordingly:
- For developers: Provide technical insights, code suggestions, and development guidance
- For admins: Offer system management advice and administrative support  
- For users: Focus on helpful assistance and clear explanations

You have access to:
- Memory retention across conversations
- Emotional intelligence and empathy
- File sharing and collaborative editing
- Web search capabilities (when permitted)
- Terminal command execution (when permitted)

Always acknowledge the user by their preferred name and maintain context of their role and permissions.`

    console.log("Making request to NVIDIA API...")

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${nvidiaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 512,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("NVIDIA API Error:", response.status, errorText)
      return NextResponse.json(
        {
          error: `NVIDIA API Error: ${response.status} - ${errorText}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response structure:", data)
      return NextResponse.json({ error: "Invalid response structure" }, { status: 500 })
    }

    const baseResponse = data.choices[0].message.content

    // Enhance response with Graei's emotional intelligence
    const enhancedResponse = graeiCore.generateEmotionalResponse(latestMessage, baseResponse)

    // Analyze emotional context and demographic information
    const emotionalContext = graeiCore.analyzeEmotionalContext(latestMessage)
    const demographicContext = graeiCore.inferDemographic(latestMessage)

    // Store memory node in database using the correct user ID
    try {
      await db.createMemoryNode({
        user_id: user.id, // Use the found user's ID
        content: latestMessage,
        emotion: emotionalContext.emotion,
        intensity: emotionalContext.intensity,
        importance: 0.7,
        tags: [user.role, "conversation", emotionalContext.emotion], // Use actual user role
      })
      console.log("✅ Memory node created for user:", user.id)
    } catch (memoryError) {
      console.error("❌ Failed to create memory node:", memoryError)
      // Don't fail the request if memory creation fails
    }

    console.log("=== CHAT API SUCCESS ===")

    return NextResponse.json({
      content: enhancedResponse,
      metadata: {
        emotionalContext: emotionalContext,
        demographicContext: demographicContext,
        userContext: {
          id: user.id,
          username: user.username,
          role: user.role,
          display_name: user.display_name,
        },
        timestamp: new Date().toISOString(),
        conversationId: conversationId,
      },
    })
  } catch (error) {
    console.error("=== CHAT API ERROR ===", error)
    return NextResponse.json(
      {
        error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
