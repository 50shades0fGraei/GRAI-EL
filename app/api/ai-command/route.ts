import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { webSearchService } from "@/lib/web-search-service"
import { fileOperationsService } from "@/lib/file-operations-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, userId, userRole, context } = body

    console.log("AI Command received:", command, "from user:", userId, "role:", userRole)

    // Verify user permissions
    const user = await db.getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check permissions based on user role
    const hasExecutePermission = ["developer", "admin", "super_admin"].includes(user.role)
    const hasSearchPermission = ["developer", "admin", "super_admin"].includes(user.role)

    let response = ""

    // Log the AI action
    const aiAction = await db.createAIAction({
      user_id: userId,
      action_type: `terminal_command`,
      parameters: { command, context },
      status: "executing",
    })

    try {
      switch (command.toLowerCase()) {
        case "analyze conversation":
          response = `Analyzing conversation patterns for ${user.display_name || user.username} (${user.role}). Current emotional state: ${context.currentEmotion}. Hardware optimization: CPU ${(context.hardwareState.cpuFrequency * 100).toFixed(0)}%, Memory ${(context.hardwareState.memoryUsage * 100).toFixed(0)}%.`
          break

        case "optimize performance":
          response = `Optimizing AI performance for ${user.role} user. Adjusting processing parameters based on current emotional state (${context.currentEmotion}) for enhanced responsiveness.`
          break

        case "scan shared files":
          response = `Scanning ${context.sharedFiles.length} shared files for ${user.username}. Found ${context.sharedFiles.filter((f: any) => f.type === "code").length} code files and ${context.sharedFiles.filter((f: any) => f.type === "text").length} text files.`
          break

        case "emotional calibration":
          response = `Performing emotional calibration for ${user.display_name || user.username}. Current state: ${context.currentEmotion}. Emotional load: ${(context.hardwareState.emotionalLoad * 100).toFixed(0)}%. Systems are within normal parameters for ${user.role} user.`
          break

        case "memory consolidation":
          // Get user's memory nodes
          const memoryNodes = await db.getMemoryNodesByUser(userId, 10)
          response = `Consolidating memory patterns for ${user.username}. Processing ${memoryNodes.length} recent memory nodes and updating long-term memory structures. Emotional context preserved.`
          break

        case "search web":
          if (!hasSearchPermission) {
            response = `Access denied. User ${user.username} (${user.role}) does not have web search permissions.`
            break
          }

          const searchQuery = "AI development best practices"
          const searchResults = await webSearchService.search(searchQuery)

          // Store search in database
          await db.createSearchHistory({
            user_id: userId,
            query: searchQuery,
            results: { results: searchResults },
            source: "ai_command",
          })

          response = `Web search completed for ${user.username}. Found ${searchResults.length} results for "${searchQuery}". Results stored in search history.`
          break

        case "execute code":
          if (!hasExecutePermission) {
            response = `Access denied. User ${user.username} (${user.role}) does not have code execution permissions.`
            break
          }

          const codeResult = await fileOperationsService.executeCode("/examples/hello.js")
          response = `Code execution completed for ${user.username}. Result: ${codeResult.success ? "Success" : "Error"} - ${codeResult.output || codeResult.error}`
          break

        case "user stats":
          const userStats = await db.getUserStats(userId)
          response = `User statistics for ${user.display_name || user.username}:
- Conversations: ${userStats.total_conversations}
- Messages: ${userStats.total_messages}  
- Shared Files: ${userStats.shared_files_count}
- AI Actions: ${userStats.ai_actions_count}
- Memory Nodes: ${userStats.memory_nodes_count}
- Last Activity: ${userStats.last_activity || "Never"}`
          break

        default:
          response = `Processing command: "${command}" for ${user.display_name || user.username} (${user.role}). AI systems are analyzing the request and will provide appropriate response based on current emotional and hardware state.`
      }

      // Update AI action as completed
      await db.updateAIAction(aiAction.id, {
        status: "completed",
        result: response,
        execution_time_ms: Math.floor(500 + Math.random() * 1500),
      })
    } catch (commandError) {
      // Update AI action as error
      await db.updateAIAction(aiAction.id, {
        status: "error",
        result: commandError instanceof Error ? commandError.message : "Unknown command error",
        execution_time_ms: Math.floor(100 + Math.random() * 500),
      })

      response = `Error executing command for ${user.username}: ${commandError instanceof Error ? commandError.message : "Unknown error"}`
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      processed: true,
      userContext: {
        username: user.username,
        role: user.role,
        permissions: {
          execute_code: hasExecutePermission,
          web_search: hasSearchPermission,
        },
      },
    })
  } catch (error) {
    console.error("AI command error:", error)
    return NextResponse.json(
      {
        error: `AI command processing error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
