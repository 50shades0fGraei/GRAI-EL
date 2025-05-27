"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Terminal, FileText, Code, Play, CloudyIcon as Clear, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TerminalEntry {
  id: string
  type: "command" | "output" | "error" | "ai-action" | "file-content" | "search-result"
  content: string
  timestamp: Date
  user: "human" | "ai"
}

interface SharedFile {
  id: string
  name: string
  content: string
  type: "text" | "code" | "json" | "markdown"
  lastModified: Date
  sharedBy: "human" | "ai"
}

interface SharedTerminalProps {
  onAICommand: (command: string) => void
  onFileShare: (file: SharedFile) => void
}

export function SharedTerminal({ onAICommand, onFileShare }: SharedTerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: "welcome",
      type: "output",
      content: "🤖 Graei AI Terminal - Collaborative Workspace Initialized\nType 'help' for available commands",
      timestamp: new Date(),
      user: "ai",
    },
  ])
  const [command, setCommand] = useState("")
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [currentFile, setCurrentFile] = useState<SharedFile | null>(null)
  const [isAITyping, setIsAITyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  const addEntry = (type: TerminalEntry["type"], content: string, user: "human" | "ai" = "human") => {
    const newEntry: TerminalEntry = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
      user,
    }
    setEntries((prev) => [...prev, newEntry])
    return newEntry
  }

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim()
    if (!trimmedCmd) return

    // Add command to terminal
    addEntry("command", `$ ${trimmedCmd}`, "human")

    // Parse command
    const [baseCmd, ...args] = trimmedCmd.split(" ")

    switch (baseCmd.toLowerCase()) {
      case "help":
        addEntry(
          "output",
          `Available Commands:
• help - Show this help message
• search <query> - Search the internet
• file <filename> - Create/edit a file
• ls - List shared files
• cat <filename> - View file content
• clear - Clear terminal
• ai <command> - Send command to AI
• share <filename> - Share file with AI
• web <url> - Fetch web content
• code <language> - Create code snippet`,
          "ai",
        )
        break

      case "search":
        if (args.length === 0) {
          addEntry("error", "Usage: search <query>", "ai")
        } else {
          const query = args.join(" ")
          addEntry("output", `🔍 Searching for: "${query}"`, "ai")
          await simulateWebSearch(query)
        }
        break

      case "file":
        if (args.length === 0) {
          addEntry("error", "Usage: file <filename>", "ai")
        } else {
          const filename = args[0]
          createOrEditFile(filename)
        }
        break

      case "ls":
        if (sharedFiles.length === 0) {
          addEntry("output", "No shared files", "ai")
        } else {
          const fileList = sharedFiles
            .map((f) => `${f.name} (${f.type}) - ${f.lastModified.toLocaleString()} - by ${f.sharedBy}`)
            .join("\n")
          addEntry("output", fileList, "ai")
        }
        break

      case "cat":
        if (args.length === 0) {
          addEntry("error", "Usage: cat <filename>", "ai")
        } else {
          const filename = args[0]
          const file = sharedFiles.find((f) => f.name === filename)
          if (file) {
            addEntry("file-content", `=== ${file.name} ===\n${file.content}`, "ai")
            setCurrentFile(file)
          } else {
            addEntry("error", `File not found: ${filename}`, "ai")
          }
        }
        break

      case "clear":
        setEntries([])
        break

      case "ai":
        if (args.length === 0) {
          addEntry("error", "Usage: ai <command>", "ai")
        } else {
          const aiCommand = args.join(" ")
          addEntry("ai-action", `🤖 Executing AI command: ${aiCommand}`, "ai")
          onAICommand(aiCommand)
          simulateAIResponse(aiCommand)
        }
        break

      case "share":
        if (args.length === 0) {
          addEntry("error", "Usage: share <filename>", "ai")
        } else {
          const filename = args[0]
          const file = sharedFiles.find((f) => f.name === filename)
          if (file) {
            addEntry("output", `📤 Shared ${filename} with AI`, "ai")
            onFileShare(file)
          } else {
            addEntry("error", `File not found: ${filename}`, "ai")
          }
        }
        break

      case "web":
        if (args.length === 0) {
          addEntry("error", "Usage: web <url>", "ai")
        } else {
          const url = args[0]
          addEntry("output", `🌐 Fetching: ${url}`, "ai")
          await simulateWebFetch(url)
        }
        break

      case "code":
        const language = args[0] || "javascript"
        createCodeSnippet(language)
        break

      default:
        addEntry("error", `Command not found: ${baseCmd}. Type 'help' for available commands.`, "ai")
    }
  }

  const simulateWebSearch = async (query: string) => {
    setIsAITyping(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockResults = [
      `📄 ${query} - Wikipedia`,
      `🔗 ${query} tutorial - MDN Web Docs`,
      `💡 Best practices for ${query} - Stack Overflow`,
      `📚 ${query} documentation - Official Docs`,
    ]

    addEntry("search-result", `Search Results for "${query}":\n${mockResults.join("\n")}`, "ai")
    setIsAITyping(false)
  }

  const simulateWebFetch = async (url: string) => {
    setIsAITyping(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockContent = `<!DOCTYPE html>
<html>
<head>
    <title>Fetched Content</title>
</head>
<body>
    <h1>Sample Web Content</h1>
    <p>This is simulated content from ${url}</p>
    <p>In a real implementation, this would fetch actual web content.</p>
</body>
</html>`

    addEntry("file-content", `=== Content from ${url} ===\n${mockContent}`, "ai")
    setIsAITyping(false)
  }

  const simulateAIResponse = async (command: string) => {
    setIsAITyping(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const responses = [
      `✅ AI processed command: "${command}"`,
      `🧠 AI is analyzing the request...`,
      `🔄 AI is executing the task in the background`,
      `📊 AI has updated its knowledge base`,
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    addEntry("ai-action", randomResponse, "ai")
    setIsAITyping(false)
  }

  const createOrEditFile = (filename: string) => {
    const existingFile = sharedFiles.find((f) => f.name === filename)
    const content = existingFile?.content || `# ${filename}\n\nNew file created at ${new Date().toLocaleString()}`

    const newFile: SharedFile = {
      id: Date.now().toString(),
      name: filename,
      content,
      type: getFileType(filename),
      lastModified: new Date(),
      sharedBy: "human",
    }

    if (existingFile) {
      setSharedFiles((prev) => prev.map((f) => (f.name === filename ? newFile : f)))
      addEntry("output", `📝 Updated file: ${filename}`, "ai")
    } else {
      setSharedFiles((prev) => [...prev, newFile])
      addEntry("output", `📄 Created file: ${filename}`, "ai")
    }

    setCurrentFile(newFile)
  }

  const createCodeSnippet = (language: string) => {
    const filename = `snippet_${Date.now()}.${getExtension(language)}`
    const content = getCodeTemplate(language)

    const newFile: SharedFile = {
      id: Date.now().toString(),
      name: filename,
      content,
      type: "code",
      lastModified: new Date(),
      sharedBy: "human",
    }

    setSharedFiles((prev) => [...prev, newFile])
    setCurrentFile(newFile)
    addEntry("output", `💻 Created ${language} code snippet: ${filename}`, "ai")
  }

  const getFileType = (filename: string): SharedFile["type"] => {
    const ext = filename.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "js":
      case "ts":
      case "py":
      case "java":
      case "cpp":
      case "c":
        return "code"
      case "json":
        return "json"
      case "md":
        return "markdown"
      default:
        return "text"
    }
  }

  const getExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
    }
    return extensions[language] || "txt"
  }

  const getCodeTemplate = (language: string): string => {
    const templates: Record<string, string> = {
      javascript: `// JavaScript Code Snippet
console.log("Hello, World!");

function example() {
    return "This is a JavaScript example";
}`,
      python: `# Python Code Snippet
print("Hello, World!")

def example():
    return "This is a Python example"`,
      typescript: `// TypeScript Code Snippet
interface Example {
    message: string;
}

const example: Example = {
    message: "Hello, World!"
};`,
    }
    return templates[language] || `// ${language} code snippet\n// Add your code here`
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const newFile: SharedFile = {
          id: Date.now().toString(),
          name: file.name,
          content,
          type: getFileType(file.name),
          lastModified: new Date(),
          sharedBy: "human",
        }
        setSharedFiles((prev) => [...prev, newFile])
        setCurrentFile(newFile)
        addEntry("output", `📁 Uploaded file: ${file.name}`, "ai")
      }
      reader.readAsText(file)
    }
  }

  const updateFileContent = (content: string) => {
    if (currentFile) {
      const updatedFile = { ...currentFile, content, lastModified: new Date() }
      setSharedFiles((prev) => prev.map((f) => (f.id === currentFile.id ? updatedFile : f)))
      setCurrentFile(updatedFile)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim()) {
      executeCommand(command)
      setCommand("")
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="terminal" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="terminal" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="h-5 w-5" />
                Shared Terminal
                <Badge variant="secondary" className="ml-auto">
                  {isAITyping ? "AI Typing..." : "Ready"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4 font-mono text-sm" ref={scrollRef}>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="group">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 min-w-[60px]">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                        <div className="flex-1">
                          <div
                            className={`${
                              entry.type === "command"
                                ? "text-blue-600 font-semibold"
                                : entry.type === "error"
                                  ? "text-red-600"
                                  : entry.type === "ai-action"
                                    ? "text-purple-600"
                                    : entry.type === "file-content"
                                      ? "text-green-600"
                                      : entry.type === "search-result"
                                        ? "text-orange-600"
                                        : "text-gray-800"
                            }`}
                          >
                            <pre className="whitespace-pre-wrap font-mono">{entry.content}</pre>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {entry.user}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {isAITyping && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-200" />
                      </div>
                      <span>AI is typing...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <span className="text-green-600 font-mono">$</span>
                  <Input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command..."
                    className="flex-1 font-mono"
                    autoComplete="off"
                  />
                  <Button type="submit" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEntries([])}>
                    <Clear className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Shared Files
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => fileInputRef.current?.click()}>
                  Upload File
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {sharedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        currentFile?.id === file.id ? "border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => setCurrentFile(file)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          <span className="font-medium">{file.name}</span>
                          <Badge variant="secondary">{file.type}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {file.sharedBy} • {file.lastModified.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1 truncate">{file.content.substring(0, 100)}...</div>
                    </div>
                  ))}
                  {sharedFiles.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No shared files yet</p>
                      <p className="text-sm">Upload a file or create one using the terminal</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                File Editor
                {currentFile && (
                  <>
                    <span className="text-sm font-normal">- {currentFile.name}</span>
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => onFileShare(currentFile)}>
                      <Share2 className="h-4 w-4 mr-1" />
                      Share with AI
                    </Button>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              {currentFile ? (
                <textarea
                  value={currentFile.content}
                  onChange={(e) => updateFileContent(e.target.value)}
                  className="w-full h-[400px] p-3 border rounded-lg font-mono text-sm resize-none"
                  placeholder="File content..."
                />
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  <div className="text-center">
                    <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a file to edit</p>
                    <p className="text-sm">Choose from the Files tab or create a new one in the terminal</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
