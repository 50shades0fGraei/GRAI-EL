"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  Settings,
  Shield,
  Activity,
  Brain,
  FileText,
  MessageSquare,
  Calendar,
  Edit3,
  Save,
  X,
} from "lucide-react"
import { useUser } from "@/components/user-context"
import { authService } from "@/lib/auth-service"

export function UserProfile() {
  const { user, updateProfile, refreshUser } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: "",
    email: "",
  })
  const [userStats, setUserStats] = useState<any>(null)
  const [preferences, setPreferences] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      setEditForm({
        display_name: user.display_name || "",
        email: user.email || "",
      })
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      const [stats, prefs] = await Promise.all([
        authService.getUserStats(user.id),
        authService.getUserPreferences(user.id),
      ])

      setUserStats(stats)
      setPreferences(prefs)
    } catch (error) {
      console.error("Failed to load user data:", error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        display_name: editForm.display_name,
        email: editForm.email,
      })
      setIsEditing(false)
      await refreshUser()
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      user: "bg-blue-500",
      developer: "bg-purple-500",
      admin: "bg-orange-500",
      super_admin: "bg-red-500",
    }
    return colors[role] || "bg-gray-500"
  }

  const getRolePermissions = (role: string) => {
    const permissions: Record<string, string[]> = {
      user: ["Basic chat access", "File sharing", "Memory retention"],
      developer: [
        "All user permissions",
        "System editing",
        "AI management",
        "Admin panel access",
        "Code execution",
        "Web search",
      ],
      admin: ["All developer permissions", "User management", "Analytics access", "System administration"],
      super_admin: ["All permissions", "Full system control"],
    }
    return permissions[role] || []
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No user profile available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.display_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isEditing ? (
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="text-lg font-semibold"
                      placeholder="Display name"
                    />
                  ) : (
                    user.display_name || user.username
                  )}
                  <Badge className={`${getRoleColor(user.role)} text-white`}>
                    {user.role.replace("_", " ").toUpperCase()}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  @{user.username} • Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
                {isEditing ? (
                  <Input
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1"
                    placeholder="Email address"
                    type="email"
                  />
                ) : (
                  <p className="text-sm text-gray-500">{user.email || "No email set"}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{userStats.total_conversations}</p>
                      <p className="text-sm text-gray-600">Conversations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{userStats.total_messages}</p>
                      <p className="text-sm text-gray-600">Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{userStats.shared_files_count}</p>
                      <p className="text-sm text-gray-600">Shared Files</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{userStats.ai_actions_count}</p>
                      <p className="text-sm text-gray-600">AI Actions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Emotional Baseline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Emotional Baseline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-lg font-medium capitalize">{user.emotional_baseline.emotion}</p>
                  <p className="text-sm text-gray-600">Current emotional state</p>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium">{(user.emotional_baseline.intensity * 100).toFixed(0)}%</p>
                  <p className="text-sm text-gray-600">Intensity level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getRolePermissions(user.role).map((permission, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">{permission}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                User Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {preferences.map((pref) => (
                    <div key={pref.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{pref.category}</Badge>
                        <span className="text-xs text-gray-500">{new Date(pref.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{pref.key}</p>
                        <p className="text-sm text-gray-600">
                          {typeof pref.value === "object" ? JSON.stringify(pref.value) : pref.value.toString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {preferences.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No preferences set</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Last login</p>
                    <p className="text-xs text-gray-600">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
                    </p>
                  </div>
                </div>

                {userStats?.last_activity && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Last activity</p>
                      <p className="text-xs text-gray-600">{new Date(userStats.last_activity).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Account created</p>
                    <p className="text-xs text-gray-600">{new Date(user.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
