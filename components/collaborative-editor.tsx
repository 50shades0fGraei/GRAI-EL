"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Save, Share2, Upload, Edit3, Code, Bot, Users, Clock, GitBranch } from "lucide-react"

interface EditorFile {
  id: string
  name: string
  content: string
  type: "text" | "code" | "markdown" | "json" | "html" | "css" | "javascript"
  language?: string
  lastModified: Date
  lastModifiedBy: "human" | "ai"
  version: number
  isShared: boolean
  aiSuggestions?: string[]
  collaborators: Array<{
    name: string
    type: "human" | "ai"
    lastActive: Date
    cursor?: { line: number; column: number }
  }>
}

interface CollaborativeEditorProps {
  onFileShare: (file: EditorFile) => void
  onAIAssist: (file: EditorFile, request: string) => void
  sharedFiles?: EditorFile[]
}

export function CollaborativeEditor({ onFileShare, onAIAssist, sharedFiles = [] }: CollaborativeEditorProps) {
  const [files, setFiles] = useState<EditorFile[]>([
    {
      id: "welcome",
      name: "welcome.md",
      content: `# Welcome to Collaborative Editor

This is a shared workspace where you can:

- Create and edit files collaboratively
- Get AI assistance with coding and writing
- Share files with the AI for analysis
- Work together in real-time

## Features

- **Real-time collaboration** with AI
- **Syntax highlighting** for multiple languages
- **Version control** with change tracking
- **AI suggestions** and code completion
- **File sharing** and export capabilities

Start by creating a new file or editing this one!`,
      type: "markdown",
      lastModified: new Date(),
      lastModifiedBy: "ai",
      version: 1,
      isShared: false,
      collaborators: [{ name: "Graei AI", type: "ai", lastActive: new Date() }],
    },
  ])
  const [activeFileId, setActiveFileId] = useState("welcome")
  const [isAIAssisting, setIsAIAssisting] = useState(false)
  const [aiRequest, setAiRequest] = useState("")
  const [showCollaborators, setShowCollaborators] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeFile = files.find((f) => f.id === activeFileId)

  useEffect(() => {
    // Merge shared files from props
    if (sharedFiles.length > 0) {
      setFiles((prev) => {
        const newFiles = [...prev]
        sharedFiles.forEach((sharedFile) => {
          const existingIndex = newFiles.findIndex((f) => f.id === sharedFile.id)
          if (existingIndex >= 0) {
            newFiles[existingIndex] = sharedFile
          } else {
            newFiles.push(sharedFile)
          }
        })
        return newFiles
      })
    }
  }, [sharedFiles])

  const createNewFile = (name = "untitled.txt", type: EditorFile["type"] = "text") => {
    const newFile: EditorFile = {
      id: `file_${Date.now()}`,
      name,
      content: getTemplateContent(type),
      type,
      language: getLanguageFromType(type),
      lastModified: new Date(),
      lastModifiedBy: "human",
      version: 1,
      isShared: false,
      collaborators: [
        { name: "You", type: "human", lastActive: new Date() },
        { name: "Graei AI", type: "ai", lastActive: new Date() },
      ],
    }
    setFiles((prev) => [...prev, newFile])
    setActiveFileId(newFile.id)
    return newFile
  }

  const getTemplateContent = (type: EditorFile["type"]): string => {
    const templates = {
      text: "# New Text File\n\nStart writing here...",
      code: "// New Code File\n\nfunction main() {\n    console.log('Hello, World!');\n}",
      markdown: "# New Markdown File\n\nStart writing your documentation here...",
      json: '{\n    "name": "example",\n    "version": "1.0.0",\n    "description": "A new JSON file"\n}',
      html: "<!DOCTYPE html>\n<html>\n<head>\n    <title>New HTML File</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>",
      css: "/* New CSS File */\n\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}",
      javascript:
        "// New JavaScript File\n\nconsole.log('Hello, World!');\n\nfunction example() {\n    return 'This is an example function';\n}",
    }
    return templates[type] || ""
  }

  const getLanguageFromType = (type: EditorFile["type"]): string => {
    const languageMap = {
      code: "javascript",
      javascript: "javascript",
      html: "html",
      css: "css",
      json: "json",
      markdown: "markdown",
      text: "text",
    }
    return languageMap[type] || "text"
  }

  const updateFileContent = (fileId: string, content: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              content,
              lastModified: new Date(),
              lastModifiedBy: "human",
              version: file.version + 1,
            }
          : file,
      ),
    )
  }

  const saveFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (!file) return

    // Simulate saving
    console.log(`Saving file: ${file.name}`)

    // In a real implementation, this would save to a backend
    const blob = new Blob([file.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const shareFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (!file) return

    const sharedFile = { ...file, isShared: true }
    setFiles((prev) => prev.map((f) => (f.id === fileId ? sharedFile : f)))
    onFileShare(sharedFile)
  }

  const requestAIAssistance = async () => {
    if (!activeFile || !aiRequest.trim()) return

    setIsAIAssisting(true)
    try {
      await onAIAssist(activeFile, aiRequest)

      // Simulate AI response
      setTimeout(() => {
        const aiSuggestions = generateAISuggestions(activeFile, aiRequest)
        setFiles((prev) =>
          prev.map((file) =>
            file.id === activeFile.id
              ? {
                  ...file,
                  aiSuggestions,
                  collaborators: file.collaborators.map((c) =>
                    c.type === "ai" ? { ...c, lastActive: new Date() } : c,
                  ),
                }
              : file,
          ),
        )
        setAiRequest("")
        setIsAIAssisting(false)
      }, 2000)
    } catch (error) {
      console.error("AI assistance error:", error)
      setIsAIAssisting(false)
    }
  }

  const generateAISuggestions = (file: EditorFile, request: string): string[] => {
    // Generate contextual AI suggestions
    const suggestions = [
      "Consider adding error handling to this function",
      "This code could be optimized for better performance",
      "Add documentation comments for better readability",
      "Consider breaking this into smaller functions",
      "Add unit tests for this functionality",
    ]

    if (file.type === "markdown") {
      return [
        "Add a table of contents for better navigation",
        "Include code examples to illustrate concepts",
        "Add links to related resources",
        "Consider adding diagrams or images",
        "Structure content with clear headings",
      ]
    }

    return suggestions.slice(0, 3)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const fileType = getFileTypeFromName(file.name)

      const newFile: EditorFile = {
        id: `uploaded_${Date.now()}`,
        name: file.name,
        content,
        type: fileType,
        language: getLanguageFromType(fileType),
        lastModified: new Date(),
        lastModifiedBy: "human",
        version: 1,
        isShared: false,
        collaborators: [
          { name: "You", type: "human", lastActive: new Date() },
          { name: "Graei AI", type: "ai", lastActive: new Date() },
        ],
      }

      setFiles((prev) => [...prev, newFile])
      setActiveFileId(newFile.id)
    }
    reader.readAsText(file)
  }

  const getFileTypeFromName = (filename: string): EditorFile["type"] => {
    const extension = filename.split(".").pop()?.toLowerCase()
    const typeMap: Record<string, EditorFile["type"]> = {
      txt: "text",
      md: "markdown",
      js: "javascript",
      ts: "javascript",
      html: "html",
      css: "css",
      json: "json",
    }
    return typeMap[extension || ""] || "text"
  }

  const getFileIcon = (type: EditorFile["type"]) => {
    const icons = {
      text: FileText,
      code: Code,
      markdown: FileText,
      json: Code,
      html: Code,
      css: Code,
      javascript: Code,
    }
    const Icon = icons[type] || FileText
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Edit3 className="h-5 w-5" />
            Collaborative Editor
            <Badge variant="secondary" className="ml-auto">
              {files.length} file{files.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>

          {/* File Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => createNewFile()}>
              <FileText className="h-4 w-4 mr-1" />
              New File
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
            {activeFile && (
              <>
                <Button variant="outline" size="sm" onClick={() => saveFile(activeFile.id)}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => shareFile(activeFile.id)}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.md,.js,.ts,.html,.css,.json"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex p-0">
          <div className="flex-1 flex">
            {/* File List Sidebar */}
            <div className="w-64 border-r bg-gray-50 p-4">
              <h3 className="font-medium mb-3">Files</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        activeFileId === file.id ? "bg-blue-100 border border-blue-300" : ""
                      }`}
                      onClick={() => setActiveFileId(file.id)}
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        {file.isShared && <Share2 className="h-3 w-3 text-blue-500" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        v{file.version} • {file.lastModifiedBy}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Collaborators */}
              {showCollaborators && activeFile && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Collaborators</h4>
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    {activeFile.collaborators.map((collaborator, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            collaborator.type === "ai" ? "bg-purple-500" : "bg-green-500"
                          }`}
                        />
                        <span className="text-xs">{collaborator.name}</span>
                        <Clock className="h-3 w-3 text-gray-400 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col">
              {activeFile ? (
                <>
                  {/* File Header */}
                  <div className="border-b p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(activeFile.type)}
                        <span className="font-medium">{activeFile.name}</span>
                        <Badge variant="outline">{activeFile.type}</Badge>
                        {activeFile.isShared && <Badge variant="secondary">Shared</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <GitBranch className="h-4 w-4" />
                        <span>v{activeFile.version}</span>
                        <span>•</span>
                        <span>{activeFile.lastModified.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 p-4">
                    <Textarea
                      value={activeFile.content}
                      onChange={(e) => updateFileContent(activeFile.id, e.target.value)}
                      className="w-full h-full resize-none font-mono text-sm"
                      placeholder="Start typing..."
                    />
                  </div>

                  {/* AI Assistance Panel */}
                  <div className="border-t p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">AI Assistant</span>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <Input
                        value={aiRequest}
                        onChange={(e) => setAiRequest(e.target.value)}
                        placeholder="Ask AI to help with this file..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            requestAIAssistance()
                          }
                        }}
                      />
                      <Button onClick={requestAIAssistance} disabled={isAIAssisting || !aiRequest.trim()} size="sm">
                        {isAIAssisting ? (
                          <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* AI Suggestions */}
                    {activeFile.aiSuggestions && activeFile.aiSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-purple-800">AI Suggestions:</h5>
                        <div className="space-y-1">
                          {activeFile.aiSuggestions.map((suggestion, index) => (
                            <div key={index} className="text-sm text-purple-700 bg-purple-50 p-2 rounded">
                              • {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a file to start editing</p>
                    <p className="text-sm mt-2">Create a new file or upload an existing one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
