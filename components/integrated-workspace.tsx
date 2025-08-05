"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Globe,
  Search,
  ArrowLeft,
  ArrowRight,
  RefreshCwIcon as Refresh,
  Home,
  Share2,
  ExternalLink,
  Bot,
  FileText,
  Code,
  Upload,
  Save,
  MessageSquare,
} from "lucide-react"

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

interface SharedFile {
  id: string
  name: string
  content: string
  type: "text" | "code" | "json" | "markdown"
  lastModified: Date
  sharedBy: "human" | "ai"
}

interface IntegratedWorkspaceProps {
  onFileShare: (file: SharedFile) => void
  onContentShare: (content: string, source: string, type: "browser" | "file") => void
  onAIAssist: (file: SharedFile, request: string) => void
  onSearchRequest: (query: string) => void
  sharedFiles: SharedFile[]
}

export function IntegratedWorkspace({
  onFileShare,
  onContentShare,
  onAIAssist,
  onSearchRequest,
  sharedFiles,
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
  const [activeTabId, setActiveTabId] = useState("home")
  const [addressBar, setAddressBar] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [aiGuidanceVisible, setAiGuidanceVisible] = useState(false)
  const [currentGuidance, setCurrentGuidance] = useState("")

  // Editor state
  const [currentFile, setCurrentFile] = useState<SharedFile | null>(null)
  const [editorContent, setEditorContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeTab = browserTabs.find((tab) => tab.id === activeTabId)

  const createNewTab = (url = "", title = "New Tab") => {
    const newTab: BrowserTab = {
      id: `tab_${Date.now()}`,
      title,
      url,
      content: "",
      isLoading: false,
      lastVisited: new Date(),
    }
    setBrowserTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
    return newTab
  }

  const closeTab = (tabId: string) => {
    if (browserTabs.length <= 1) return

    setBrowserTabs((prev) => prev.filter((tab) => tab.id !== tabId))
    if (activeTabId === tabId) {
      const remainingTabs = browserTabs.filter((tab) => tab.id !== tabId)
      setActiveTabId(remainingTabs[0]?.id || "")
    }
  }

  const navigateToUrl = async (url: string, tabId?: string) => {
    const targetTabId = tabId || activeTabId
    const targetTab = browserTabs.find((tab) => tab.id === targetTabId)
    if (!targetTab) return

    // Update tab as loading
    setBrowserTabs((prev) => prev.map((tab) => (tab.id === targetTabId ? { ...tab, isLoading: true, url } : tab)))

    try {
      // Simulate web content fetching
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

      // Generate AI guidance
      const guidance = await generateAIGuidance(url, content)
      setCurrentGuidance(guidance)
      setAiGuidanceVisible(true)
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
    onSearchRequest(query)

    try {
      const results = await performWebSearch(query)
      setSearchResults(results)

      // Auto-navigate to top result if it's highly relevant
      if (results.length > 0 && results[0].relevanceScore > 0.8) {
        navigateToUrl(results[0].url)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const fetchWebContent = async (url: string): Promise<string> => {
    // Simulate fetching web content
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    if (url === "graei://home") {
      return `
        <div class="home-page">
          <h1>Graei AI Browser</h1>
          <p>Welcome to the AI-enhanced collaborative browser!</p>
          <div class="features">
            <h2>Features:</h2>
            <ul>
              <li>AI-guided web navigation</li>
              <li>Contextual search suggestions</li>
              <li>Content sharing and collaboration</li>
              <li>Smart bookmarking</li>
              <li>Real-time AI assistance</li>
            </ul>
          </div>
        </div>
      `
    }

    // Simulate different types of content based on URL
    const domain = new URL(url).hostname
    const mockContent = {
      "developer.mozilla.org": `
        <h1>MDN Web Docs</h1>
        <p>The MDN Web Docs site provides information about Open Web technologies including HTML, CSS, and APIs for both Web sites and progressive web apps.</p>
        <div class="content">
          <h2>Web Technologies</h2>
          <ul>
            <li>HTML — Structuring the web</li>
            <li>CSS — Styling the web</li>
            <li>JavaScript — Dynamic client-side scripting</li>
            <li>Web APIs — Programming web functionality</li>
          </ul>
        </div>
      `,
      "stackoverflow.com": `
        <h1>Stack Overflow</h1>
        <p>Stack Overflow is the largest, most trusted online community for developers to learn, share their programming knowledge, and build their careers.</p>
        <div class="questions">
          <h2>Recent Questions</h2>
          <div class="question">
            <h3>How to implement authentication in React?</h3>
            <p>I'm building a React application and need to implement user authentication...</p>
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
        <p>In a real implementation, this would fetch actual web content.</p>
      </div>
    `
    )
  }

  const performWebSearch = async (query: string): Promise<SearchResult[]> => {
    // Simulate web search
    await new Promise((resolve) => setTimeout(resolve, 800))

    const mockResults: SearchResult[] = [
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
        snippet: `Complete guide to ${query} with examples and best practices.`,
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
    ]

    return mockResults
  }

  const generateAISuggestions = async (url: string, content: string): Promise<string[]> => {
    // Generate AI suggestions based on content
    await new Promise((resolve) => setTimeout(resolve, 500))

    const suggestions = [
      "Bookmark this page for future reference",
      "Share relevant sections with your team",
      "Take notes on key concepts",
      "Explore related topics",
      "Check for updated information",
    ]

    return suggestions.slice(0, 3)
  }

  const generateAIGuidance = async (url: string, content: string): Promise<string> => {
    // Generate contextual AI guidance
    const domain = new URL(url).hostname

    const guidanceMap: Record<string, string> = {
      "developer.mozilla.org":
        "This is excellent documentation for web development. I recommend bookmarking specific API references you're working with and checking the browser compatibility tables.",
      "stackoverflow.com":
        "Great resource for solving coding problems. Look for answers with high vote counts and recent activity. Consider the accepted answer but also check newer solutions.",
      "github.com":
        "Perfect for finding code examples and libraries. Check the README, issues, and recent commits to assess project health. Star repositories you find useful.",
      "wikipedia.org":
        "Reliable source for general information. Check the references section for primary sources and related articles for deeper understanding.",
    }

    return (
      guidanceMap[domain] ||
      `I can help you navigate this content. Look for key information that relates to your current goals and consider how this might be useful for your projects.`
    )
  }

  const extractTitle = (content: string): string => {
    const titleMatch = content.match(/<h1[^>]*>([^<]*)<\/h1>/i)
    return titleMatch ? titleMatch[1] : ""
  }

  const handleAddressBarSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (addressBar.trim()) {
      let url = addressBar.trim()
      if (!url.startsWith("http") && !url.startsWith("graei://")) {
        url = `https://${url}`
      }
      navigateToUrl(url)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      handleSearch(searchQuery)
    }
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
        onFileShare(newFile)
        setCurrentFile(newFile)
        setEditorContent(content)
        setIsEditing(true)
      }
      reader.readAsText(file)
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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
      case "html":
      case "css":
        return "code"
      case "json":
        return "json"
      case "md":
        return "markdown"
      default:
        return "text"
    }
  }

  const createNewFile = () => {
    const newFile: SharedFile = {
      id: Date.now().toString(),
      name: `untitled_${Date.now()}.txt`,
      content: "",
      type: "text",
      lastModified: new Date(),
      sharedBy: "human",
    }
    onFileShare(newFile)
    setCurrentFile(newFile)
    setEditorContent("")
    setIsEditing(true)
  }

  const saveCurrentFile = () => {
    if (currentFile) {
      const updatedFile = {
        ...currentFile,
        content: editorContent,
        lastModified: new Date(),
      }
      onFileShare(updatedFile)
      setCurrentFile(updatedFile)
      setIsEditing(false)
    }
  }

  const shareFileToChat = (file: SharedFile) => {
    onContentShare(file.content, file.name, "file")
  }

  const requestAIAssist = (file: SharedFile) => {
    const request = prompt("What would you like help with for this file?")
    if (request) {
      onAIAssist(file, request)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-purple-600" />
          Workspace Tools
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs defaultValue="browser" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="browser">Browser</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="browser" className="flex-1 flex flex-col m-4 mt-2">
            <div className="space-y-2">
              {/* Browser Controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => activeTab && navigateToUrl(activeTab.url)}>
                  <Refresh className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateToUrl("graei://home")}>
                  <Home className="h-4 w-4" />
                </Button>
              </div>

              {/* Address Bar */}
              <form onSubmit={handleAddressBarSubmit} className="flex gap-2">
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
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the web..."
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
            </div>

            {/* Content Display */}
            <ScrollArea className="flex-1 mt-4">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Search Results for "{searchQuery}"</h4>
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigateToUrl(result.url)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-blue-600 hover:underline text-sm">{result.title}</h5>
                          <p className="text-xs text-green-600 mb-1">{result.url}</p>
                          <p className="text-xs text-gray-600">{result.snippet}</p>
                        </div>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {result.source}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab ? (
                <div className="space-y-3">
                  {activeTab.content ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">{activeTab.title}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onContentShare(activeTab.content, activeTab.url, "browser")}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share to Chat
                        </Button>
                      </div>
                      <div
                        className="text-sm prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: activeTab.content }}
                      />

                      {activeTab.aiSuggestions && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                          <h5 className="font-medium text-purple-800 mb-2 text-sm">AI Suggestions:</h5>
                          <ul className="text-xs text-purple-700 space-y-1">
                            {activeTab.aiSuggestions.map((suggestion, index) => (
                              <li key={index}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Enter a URL or search query to browse</p>
                    </div>
                  )}
                </div>
              ) : null}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="editor" className="flex-1 flex flex-col m-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={createNewFile}>
                  <FileText className="h-4 w-4 mr-1" />
                  New File
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" />
                  Upload File
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              </div>
              {currentFile && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={saveCurrentFile} disabled={!isEditing}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => shareFileToChat(currentFile)}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share to Chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => requestAIAssist(currentFile)}>
                    <Bot className="h-4 w-4 mr-1" />
                    AI Assist
                  </Button>
                </div>
              )}
            </div>

            {currentFile ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{currentFile.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentFile.type}
                  </Badge>
                  {isEditing && (
                    <Badge variant="outline" className="text-xs">
                      Editing
                    </Badge>
                  )}
                </div>
                <Textarea
                  value={editorContent}
                  onChange={(e) => {
                    setEditorContent(e.target.value)
                    setIsEditing(true)
                  }}
                  className="flex-1 font-mono text-sm resize-none"
                  placeholder="Start typing..."
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Create a new file or upload one to start editing</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="flex-1 flex flex-col m-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Shared Files ({sharedFiles.length})</h4>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {sharedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      currentFile?.id === file.id ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      setCurrentFile(file)
                      setEditorContent(file.content)
                      setIsEditing(false)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium text-sm">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            shareFileToChat(file)
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            requestAIAssist(file)
                          }}
                        >
                          <Bot className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {file.sharedBy} • {file.lastModified.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 truncate">{file.content.substring(0, 100)}...</div>
                  </div>
                ))}
                {sharedFiles.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No files yet</p>
                    <p className="text-xs">Upload a file or create one in the editor</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
