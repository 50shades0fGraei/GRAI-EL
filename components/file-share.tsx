"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Upload, Download, Brain, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileShareProps {
  onProfileImport: (profileData: string) => void
  onProfileExport: () => string
  onFrameworkUpdate: (framework: string) => void
}

export function FileShare({ onProfileImport, onProfileExport, onFrameworkUpdate }: FileShareProps) {
  const [uploadedContent, setUploadedContent] = useState("")
  const [frameworkCode, setFrameworkCode] = useState("")
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setUploadedContent(content)

        // Try to import as profile
        try {
          JSON.parse(content)
          onProfileImport(content)
          setMessage("Profile imported successfully!")
        } catch {
          // If not JSON, treat as framework code
          setFrameworkCode(content)
          setMessage("Framework code loaded successfully!")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExportProfile = () => {
    const profileData = onProfileExport()
    const blob = new Blob([profileData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `graei-profile-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage("Profile exported successfully!")
  }

  const handleFrameworkUpdate = () => {
    if (frameworkCode.trim()) {
      onFrameworkUpdate(frameworkCode)
      setMessage("Framework updated successfully!")
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Identity Development
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Profile/Framework</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,.py,.ts,.js,.txt"
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </div>

            {/* Profile Export */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Export AI Profile</label>
              <Button onClick={handleExportProfile} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Profile
              </Button>
            </div>
          </div>

          {/* Framework Code Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Framework Code Integration</label>
            <Textarea
              value={frameworkCode}
              onChange={(e) => setFrameworkCode(e.target.value)}
              placeholder="Paste framework code here to integrate with the AI..."
              className="min-h-[200px] font-mono text-sm"
            />
            <Button onClick={handleFrameworkUpdate} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Update AI Framework
            </Button>
          </div>

          {/* Uploaded Content Preview */}
          {uploadedContent && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Uploaded Content Preview</label>
              <div className="bg-gray-100 p-3 rounded-md max-h-40 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap">{uploadedContent.substring(0, 500)}...</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
