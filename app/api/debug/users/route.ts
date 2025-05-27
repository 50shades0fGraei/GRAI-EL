import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-database"

export async function GET(request: NextRequest) {
  try {
    // Get all users from mock database for debugging
    const developerUser = await mockDb.getUserByUsername("developer")
    const userById = developerUser ? await mockDb.getUserById(developerUser.id) : null

    return NextResponse.json({
      message: "Debug: Mock database users",
      developerByUsername: developerUser
        ? {
            id: developerUser.id,
            username: developerUser.username,
            role: developerUser.role,
          }
        : null,
      developerById: userById
        ? {
            id: userById.id,
            username: userById.username,
            role: userById.role,
          }
        : null,
      mockDbInfo: {
        usersMapSize: (mockDb as any).users?.size || "unknown",
        hasGetUserByUsername: typeof mockDb.getUserByUsername === "function",
        hasGetUserById: typeof mockDb.getUserById === "function",
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint error",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
