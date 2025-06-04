"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Globe,
  Search,
  FileText,
  Code,
  Share2,
  Bot,
  RefreshCwIcon as Refresh,
  Home,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Upload,
  File,
  Plus,
} from "lucide-react"

interface WorkspaceFile {
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
}

interface BrowserTab {
  id: string
  title: string
  url: string
  content: string
  isLoading: boolean
  lastVisited: Date
  aiSuggestions?: string[]
}

interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  relevanceScore: number
}

interface IntegratedWorkspaceProps {
  onFileShare: (file: WorkspaceFile) => void
  onContentShare: (content: string, url: string, type: "browser" | "file") => void
  onAIAssist: (file: WorkspaceFile, request: string) => void
  onSearchRequest?: (query: string) => void
  sharedFiles?: WorkspaceFile[]
}

export function IntegratedWorkspace({
  onFileShare,
  onContentShare,
  onAIAssist,
  onSearchRequest,
  sharedFiles = [],
}: IntegratedWorkspaceProps) {
  // Browser state
  const [browserTabs, setBrowserTabs] = useState<BrowserTab[]>([
    {
      id: "home",
      title: "Graei AI Browser",
      url: "graei://home",
      content: "",
      isLoading: false,
      lastVisited: new Date(),
    },
  ])
  const [activeBrowserTabId, setActiveBrowserTabId] = useState("home")
  const [addressBar, setAddressBar] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Editor state
  const [editorFiles, setEditorFiles] = useState<WorkspaceFile[]>([
    {
      id: "welcome",
      name: "welcome.md",
      content: `# Welcome to Integrated Workspace

This workspace combines:
- **Chat** with AI memory and emotional intelligence
- **Browser** for web research and guidance
- **Editor** for collaborative file editing
- **File Sharing** between all components

## How to Use:
1. Chat normally with the AI
2. Use "Search in Browser" button to research topics
3. Create files in the Editor tab
4. Share content between components using the Share buttons

Try creating a file or searching for something!`,
      type: "markdown",
      lastModified: new Date(),
      lastModifiedBy: "ai",
      version: 1,
      isShared: false,
    },
  ])
  const [activeFileId, setActiveFileId] = useState("welcome")
  const [isAIAssisting, setIsAIAssisting] = useState(false)
  const [aiRequest, setAiRequest] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeBrowserTab = browserTabs.find((tab) => tab.id === activeBrowserTabId)
  const activeFile = editorFiles.find((f) => f.id === activeFileId)

  // Sync with shared files from parent
  useEffect(() => {
    if (sharedFiles.length > 0) {
      setEditorFiles((prev) => {
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

  // Expose search function for external use
  const searchInBrowser = (query: string) => {
    setSearchQuery(query)
    handleSearch(query)
  }

  // Browser functions
  const navigateToUrl = async (url: string, tabId?: string) => {
    const targetTabId = tabId || activeBrowserTabId
    const targetTab = browserTabs.find((tab) => tab.id === targetTabId)
    if (!targetTab) return

    setBrowserTabs((prev) => prev.map((tab) => (tab.id === targetTabId ? { ...tab, isLoading: true, url } : tab)))

    try {
      const content = await fetchWebContent(url)
      const aiSuggestions = await generateAISuggestions(url, content)

      setBrowserTabs((prev) =>
        prev.map((tab) =>
          tab.id === targetTabId
            ? {
                ...tab,
                isLoading: false,
                content,
                title: extractTitle(content) || new URL(url).hostname,
                lastVisited: new Date(),
                aiSuggestions,
              }
            : tab,
        ),
      )

      setAddressBar(url)
    } catch (error) {
      setBrowserTabs((prev) =>
        prev.map((tab) =>
          tab.id === targetTabId
            ? {
                ...tab,
                isLoading: false,
                content: `Error loading page: ${error instanceof Error ? error.message : "Unknown error"}`,
              }
            : tab,
        ),
      )
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchQuery(query)

    try {
      const results = await performWebSearch(query)
      setSearchResults(results)

      // Notify parent that we're searching
      if (onSearchRequest) {
        onSearchRequest(query)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const fetchWebContent = async (url: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    if (url === "graei://home") {
      return `
        <div class="home-page">
          <h1>Graei AI Browser</h1>
          <p>Welcome to the AI-enhanced collaborative browser!</p>
          <div class="features">
            <h2>Features:</h2>
            <ul>
              <li>Manual search when you need it</li>
              <li>Content sharing with chat</li>
              <li>Smart bookmarking</li>
              <li>Real-time AI assistance</li>
            </ul>
          </div>
          <div class="quick-start">
            <h2>Quick Start:</h2>
            <p>Use the search bar above to find information, then share it with your chat using the Share button.</p>
          </div>
        </div>
      `
    }

    const domain = new URL(url).hostname
    const mockContent = {
      "developer.mozilla.org": `
        <h1>MDN Web Docs</h1>
        <p>The MDN Web Docs site provides information about Open Web technologies including HTML, CSS, and APIs.</p>
        <div class="content">
          <h2>Web Technologies</h2>
          <ul>
            <li>HTML — Structuring the web</li>
            <li>CSS — Styling the web</li>
            <li>JavaScript — Dynamic client-side scripting</li>
            <li>Web APIs — Programming web functionality</li>
          </ul>
          <h2>Learning Resources</h2>
          <p>Comprehensive guides and tutorials for web developers.</p>
        </div>
      `,
      "stackoverflow.com": `
        <h1>Stack Overflow</h1>
        <p>Stack Overflow is the largest, most trusted online community for developers.</p>
        <div class="questions">
          <h2>Recent Questions</h2>
          <div class="question">
            <h3>How to implement authentication in React?</h3>
            <p>I'm building a React application and need to implement user authentication...</p>
            <div class="answers">
              <p><strong>Answer:</strong> You can use libraries like Auth0, Firebase Auth, or implement your own JWT-based system.</p>
            </div>
          </div>
          <div class="question">
            <h3>Best practices for API design</h3>
            <p>What are the current best practices for designing RESTful APIs?</p>
            <div class="answers">
              <p><strong>Answer:</strong> Follow REST principles, use proper HTTP methods, implement proper error handling, and document your API.</p>
            </div>
          </div>
        </div>
      `,
      "github.com": `
        <h1>GitHub</h1>
        <p>GitHub is where over 100 million developers shape the future of software, together.</p>
        <div class="repositories">
          <h2>Trending Repositories</h2>
          <div class="repo">
            <h3>microsoft/vscode</h3>
            <p>Visual Studio Code - Open source code editor</p>
            <div class="stats">⭐ 150k stars • 🍴 25k forks</div>
          </div>
          <div class="repo">
            <h3>facebook/react</h3>
            <p>A declarative, efficient, and flexible JavaScript library for building user interfaces.</p>
            <div class="stats">⭐ 200k stars • 🍴 40k forks</div>
          </div>
        </div>
      `,
    }

    return (
      mockContent[domain as keyof typeof mockContent] ||
      `
      <h1>Content from ${domain}</h1>
      <p>This is simulated content from ${url}</p>
      <div class="content">
        <h2>Sample Content</h2>
        <p>Real-time content fetching simulation for ${domain}.</p>
        <ul>
          <li>Interactive content browsing</li>
          <li>AI-enhanced navigation</li>
          <li>Content sharing capabilities</li>
        </ul>
      </div>
    `
    )
  }

  const performWebSearch = async (query: string): Promise<SearchResult[]> => {
    await new Promise((resolve) => setTimeout(resolve, 800))

    return [
      {
        title: `${query} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        snippet: `Learn about ${query} from the free encyclopedia. Comprehensive information and references.`,
        source: "Wikipedia",
        relevanceScore: 0.9,
      },
      {
        title: `${query} Tutorial - MDN Web Docs`,
        url: `https://developer.mozilla.org/en-US/docs/Web/${encodeURIComponent(query)}`,
        snippet: `Complete guide to ${query} with examples and best practices for developers.`,
        source: "MDN",
        relevanceScore: 0.85,
      },
      {
        title: `${query} Questions - Stack Overflow`,
        url: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Programming questions and answers about ${query} from the developer community.`,
        source: "Stack Overflow",
        relevanceScore: 0.8,
      },
      {
        title: `${query} Projects - GitHub`,
        url: `https://github.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Open source projects and code repositories related to ${query}.`,
        source: "GitHub",
        relevanceScore: 0.75,
      },
    ]
  }

  const generateAISuggestions = async (url: string, content: string): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return ["Bookmark this page", "Share with chat", "Take notes on key concepts"]
  }

  const extractTitle = (content: string): string => {
    const titleMatch = content.match(/<h1[^>]*>([^<]*)<\/h1>/i)
    return titleMatch ? titleMatch[1] : ""
  }

  // Editor functions
  const createNewFile = (name = "untitled.txt", type: WorkspaceFile["type"] = "text") => {
    const newFile: WorkspaceFile = {
      id: `file_${Date.now()}`,
      name,
      content: getTemplateContent(type),
      type,
      language: getLanguageFromType(type),
      lastModified: new Date(),
      lastModifiedBy: "human",
      version: 1,
      isShared: false,
    }
    setEditorFiles((prev) => [...prev, newFile])
    setActiveFileId(newFile.id)
    return newFile
  }

  const getTemplateContent = (type: WorkspaceFile["type"]): string => {
    const templates = {
      text: "# New Text File\n\nStart writing here...",
      code: "// New Code File\n\nfunction main() {\n    console.log('Hello, World!');\n}",
      markdown: "# New Markdown File\n\nStart writing your documentation here...",
      json: '{\n    "name": "example",\n    "version": "1.0.0"\n}',
      html: "<!DOCTYPE html>\n<html>\n<head>\n    <title>New HTML File</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>",
      css: "/* New CSS File */\n\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}",
      javascript:
        "// New JavaScript File\n\nconsole.log('Hello, World!');\n\nfunction example() {\n    return 'This is an example';\n}",
    }
    return templates[type] || ""
  }

  const getLanguageFromType = (type: WorkspaceFile["type"]): string => {
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
    setEditorFiles((prev) =>
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

  const shareFile = (fileId: string) => {
    const file = editorFiles.find((f) => f.id === fileId)
    if (!file) return

    const sharedFile = { ...file, isShared: true }
    setEditorFiles((prev) => prev.map((f) => (f.id === fileId ? sharedFile : f)))
    onFileShare(sharedFile)

    // Also share content with chat
    onContentShare(file.content, file.name, "file")
  }

  const shareWebContent = () => {
    if (!activeBrowserTab?.content) return

    onContentShare(activeBrowserTab.content, activeBrowserTab.url, "browser")
  }

  const requestAIAssistance = async () => {
    if (!activeFile || !aiRequest.trim()) return

    setIsAIAssisting(true)
    try {
      await onAIAssist(activeFile, aiRequest)

      setTimeout(() => {
        const aiSuggestions = [
          "Consider adding error handling",
          "Add documentation comments",
          "Optimize for better performance",
        ]
        setEditorFiles((prev) => prev.map((file) => (file.id === activeFile.id ? { ...file, aiSuggestions } : file)))
        setAiRequest("")
        setIsAIAssisting(false)
      }, 2000)
    } catch (error) {
      console.error("AI assistance error:", error)
      setIsAIAssisting(false)
    }
  }

  const getFileIcon = (type: WorkspaceFile["type"]) => {
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const fileType = getFileTypeFromName(file.name)

      const newFile: WorkspaceFile = {
        id: `file_${Date.now()}`,
        name: file.name,
        content,
        type: fileType,
        language: getLanguageFromType(fileType),
        lastModified: new Date(),
        lastModifiedBy: "human",
        version: 1,
        isShared: false,
      }

      setEditorFiles((prev) => [...prev, newFile])
      setActiveFileId(newFile.id)

      // Switch to editor tab to show the uploaded file
      const editorTabElement = document.querySelector('[value="editor"]') as HTMLElement
      if (editorTabElement) {
        editorTabElement.click()
      }
    }
    reader.readAsText(file)

    // Reset the input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileTypeFromName = (filename: string): WorkspaceFile["type"] => {
    const extension = filename.split(".").pop()?.toLowerCase()
    const typeMap: Record<string, WorkspaceFile["type"]> = {
      txt: "text",
      md: "markdown",
      js: "javascript",
      ts: "javascript",
      html: "html",
      css: "css",
      json: "json",
      py: "code",
      java: "code",
      cpp: "code",
      c: "code",
    }
    return typeMap[extension || ""] || "text"
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-purple-600" />
          Workspace Tools
          <Badge variant="secondary" className="ml-auto">
            {editorFiles.length} files • {browserTabs.length} tabs
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="browser" className="h-full">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browser">Browser</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="browser" className="mt-4 px-4 pb-4">
            <div className="space-y-4">
              {/* Browser Controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activeBrowserTab && navigateToUrl(activeBrowserTab.url)}
                >
                  <Refresh className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateToUrl("graei://home")}>
                  <Home className="h-4 w-4" />
                </Button>
              </div>

              {/* Address Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (addressBar.trim()) {
                    let url = addressBar.trim()
                    if (!url.startsWith("http") && !url.startsWith("graei://")) {
                      url = `https://${url}`
                    }
                    navigateToUrl(url)
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  value={addressBar}
                  onChange={(e) => setAddressBar(e.target.value)}
                  placeholder="Enter URL..."
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </form>

              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    handleSearch(searchQuery)
                  }
                }}
                className="flex gap-2"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the web manually..."
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? (
                    <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </form>

              {/* Content Display */}
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Search Results for "{searchQuery}"</h3>
                      <Button variant="outline" size="sm" onClick={shareWebContent}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Share Results
                      </Button>
                    </div>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigateToUrl(result.url)}
                      >
                        <h4 className="font-medium text-blue-600 hover:underline">{result.title}</h4>
                        <p className="text-sm text-green-600 mb-1">{result.url}</p>
                        <p className="text-sm text-gray-600">{result.snippet}</p>
                        <Badge variant="outline" className="mt-2">
                          {result.source}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : activeBrowserTab?.content ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium">{activeBrowserTab.title}</h2>
                      <Button variant="outline" size="sm" onClick={shareWebContent}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Share to Chat
                      </Button>
                    </div>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: activeBrowserTab.content }} />
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a URL or search query to browse the web</p>
                    <p className="text-sm mt-2">Use the search bar above to find information</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="mt-4 px-4 pb-4">
            <div className="space-y-4">
              {/* Editor Controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => createNewFile()}>
                  <Plus className="h-4 w-4 mr-1" />
                  New File
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" />
                  Upload File
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.md,.js,.ts,.html,.css,.json,.py,.java,.cpp,.c"
                />
                {activeFile && (
                  <Button variant="outline" size="sm" onClick={() => shareFile(activeFile.id)}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Share to Chat
                  </Button>
                )}
              </div>

              {/* File Tabs */}
              <div className="flex gap-1 border-b overflow-x-auto pb-1">
                {editorFiles.map((file) => (
                  <button
                    key={file.id}
                    className={`px-3 py-2 text-sm border-b-2 whitespace-nowrap ${
                      activeFileId === file.id ? "border-blue-500 bg-blue-50" : "border-transparent hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      <span>{file.name}</span>
                      {file.isShared && <Share2 className="h-3 w-3 text-blue-500" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Editor */}
              {activeFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(activeFile.type)}
                      <span className="font-medium">{activeFile.name}</span>
                      <Badge variant="outline">{activeFile.type}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">v{activeFile.version}</div>
                  </div>

                  <Textarea
                    value={activeFile.content}
                    onChange={(e) => updateFileContent(activeFile.id, e.target.value)}
                    className="h-[200px] font-mono text-sm resize-none"
                    placeholder="Start typing..."
                  />

                  {/* AI Assistance */}
                  <div className="border-t pt-4">
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
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="mt-4 px-4 pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">File Manager</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => createNewFile()}>
                    <Plus className="h-4 w-4 mr-1" />
                    New File
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {editorFiles.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No files yet</p>
                      <p className="text-sm mt-2">Create a new file or upload one</p>
                    </div>
                  ) : (
                    editorFiles.map((file) => (
                      <div key={file.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="font-medium">{file.name}</span>
                            <Badge variant="secondary">{file.type}</Badge>
                            {file.isShared && <Share2 className="h-3 w-3 text-blue-500" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setActiveFileId(file.id)}>
                              <Code className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => shareFile(file.id)}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          v{file.version} • {file.lastModified.toLocaleString()} • {file.lastModifiedBy}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 truncate">{file.content.substring(0, 100)}...</div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
