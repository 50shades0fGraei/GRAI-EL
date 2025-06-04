"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Globe,
  Search,
  ArrowLeft,
  ArrowRight,
  RefreshCwIcon as Refresh,
  Home,
  Bookmark,
  Share2,
  Download,
  ExternalLink,
  Eye,
  Bot,
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

interface SharedBrowserProps {
  onAIGuidance: (url: string, context: string) => void
  onContentShare: (content: string, url: string) => void
  currentUserQuery?: string
}

export function SharedBrowser({ onAIGuidance, onContentShare, currentUserQuery }: SharedBrowserProps) {
  const [tabs, setTabs] = useState<BrowserTab[]>([
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
  const [history, setHistory] = useState<string[]>([])
  const [bookmarks, setBookmarks] = useState<Array<{ title: string; url: string }>>([
    { title: "MDN Web Docs", url: "https://developer.mozilla.org" },
    { title: "Stack Overflow", url: "https://stackoverflow.com" },
    { title: "GitHub", url: "https://github.com" },
    { title: "Wikipedia", url: "https://wikipedia.org" },
  ])
  const [aiGuidanceVisible, setAiGuidanceVisible] = useState(false)
  const [currentGuidance, setCurrentGuidance] = useState("")

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  useEffect(() => {
    if (currentUserQuery && currentUserQuery.trim()) {
      handleAISearch(currentUserQuery)
    }
  }, [currentUserQuery])

  const createNewTab = (url = "", title = "New Tab") => {
    const newTab: BrowserTab = {
      id: `tab_${Date.now()}`,
      title,
      url,
      content: "",
      isLoading: false,
      lastVisited: new Date(),
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
    return newTab
  }

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return

    setTabs((prev) => prev.filter((tab) => tab.id !== tabId))
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId)
      setActiveTabId(remainingTabs[0]?.id || "")
    }
  }

  const navigateToUrl = async (url: string, tabId?: string) => {
    const targetTabId = tabId || activeTabId
    const targetTab = tabs.find((tab) => tab.id === targetTabId)
    if (!targetTab) return

    // Update tab as loading
    setTabs((prev) => prev.map((tab) => (tab.id === targetTabId ? { ...tab, isLoading: true, url } : tab)))

    try {
      // Simulate web content fetching
      const content = await fetchWebContent(url)
      const aiSuggestions = await generateAISuggestions(url, content)

      setTabs((prev) =>
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

      // Add to history
      setHistory((prev) => [url, ...prev.filter((h) => h !== url)].slice(0, 50))
      setAddressBar(url)

      // Generate AI guidance
      const guidance = await generateAIGuidance(url, content)
      setCurrentGuidance(guidance)
      setAiGuidanceVisible(true)
      onAIGuidance(url, guidance)
    } catch (error) {
      setTabs((prev) =>
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

  const handleAISearch = async (userQuery: string) => {
    // AI-powered search that understands context
    const aiSearchQuery = await enhanceSearchQuery(userQuery)
    await handleSearch(aiSearchQuery)
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
          <div class="quick-links">
            <h2>Quick Links:</h2>
            <a href="https://developer.mozilla.org">MDN Web Docs</a>
            <a href="https://stackoverflow.com">Stack Overflow</a>
            <a href="https://github.com">GitHub</a>
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
          <h2>Learning Area</h2>
          <p>Learn web development with our structured learning area.</p>
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
          <div class="question">
            <h3>Best practices for API design</h3>
            <p>What are the current best practices for designing RESTful APIs?</p>
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
          </div>
          <div class="repo">
            <h3>facebook/react</h3>
            <p>A declarative, efficient, and flexible JavaScript library for building user interfaces.</p>
          </div>
        </div>
      `,
      "wikipedia.org": `
        <h1>Wikipedia</h1>
        <p>Wikipedia is a free online encyclopedia, created and edited by volunteers around the world.</p>
        <div class="articles">
          <h2>Featured Article</h2>
          <h3>Artificial Intelligence</h3>
          <p>Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals...</p>
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
        <ul>
          <li>Real-time content fetching</li>
          <li>HTML parsing and rendering</li>
          <li>Interactive elements</li>
          <li>Media content support</li>
        </ul>
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
      {
        title: `${query} Projects - GitHub`,
        url: `https://github.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Open source projects and code repositories related to ${query}.`,
        source: "GitHub",
        relevanceScore: 0.75,
      },
      {
        title: `Learn ${query} - Online Course`,
        url: `https://example-learning.com/${encodeURIComponent(query)}`,
        snippet: `Comprehensive online course covering ${query} fundamentals and advanced topics.`,
        source: "Learning Platform",
        relevanceScore: 0.7,
      },
    ]

    return mockResults
  }

  const enhanceSearchQuery = async (userQuery: string): Promise<string> => {
    // AI enhances the search query based on context
    const enhancements = {
      learn: "tutorial guide beginner",
      "how to": "step by step guide",
      best: "best practices recommendations",
      error: "troubleshooting fix solution",
      install: "installation setup guide",
    }

    let enhancedQuery = userQuery
    Object.entries(enhancements).forEach(([key, enhancement]) => {
      if (userQuery.toLowerCase().includes(key)) {
        enhancedQuery += ` ${enhancement}`
      }
    })

    return enhancedQuery
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

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Shared AI Browser
            <Badge variant="secondary" className="ml-auto">
              {tabs.length} tab{tabs.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>

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
              placeholder="Enter URL or search..."
              className="flex-1"
            />
            <Button type="submit" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </form>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <Tabs value={activeTabId} onValueChange={setActiveTabId} className="flex-1 flex flex-col">
            {/* Tab List */}
            <div className="border-b px-4">
              <TabsList className="h-auto p-0 bg-transparent">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <span className="max-w-32 truncate">{tab.title}</span>
                    {tab.isLoading && (
                      <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {tabs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-4 w-4 p-0 hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          closeTab(tab.id)
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </TabsTrigger>
                ))}
                <Button variant="ghost" size="sm" className="ml-2" onClick={() => createNewTab()}>
                  +
                </Button>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex">
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="p-4 border-b">
                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search the web with AI assistance..."
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
                <ScrollArea className="flex-1 p-4">
                  {searchResults.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium">Search Results for "{searchQuery}"</h3>
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigateToUrl(result.url)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-600 hover:underline">{result.title}</h4>
                              <p className="text-sm text-green-600 mb-1">{result.url}</p>
                              <p className="text-sm text-gray-600">{result.snippet}</p>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {result.source}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeTab ? (
                    <div className="space-y-4">
                      {activeTab.content ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">{activeTab.title}</h2>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onContentShare(activeTab.content, activeTab.url)}
                              >
                                <Share2 className="h-4 w-4 mr-1" />
                                Share
                              </Button>
                              <Button variant="outline" size="sm">
                                <Bookmark className="h-4 w-4 mr-1" />
                                Bookmark
                              </Button>
                            </div>
                          </div>
                          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: activeTab.content }} />

                          {activeTab.aiSuggestions && (
                            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                              <h4 className="font-medium text-purple-800 mb-2">AI Suggestions:</h4>
                              <ul className="text-sm text-purple-700 space-y-1">
                                {activeTab.aiSuggestions.map((suggestion, index) => (
                                  <li key={index}>• {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Enter a URL or search query to browse the web</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </ScrollArea>
              </div>

              {/* AI Guidance Sidebar */}
              {aiGuidanceVisible && (
                <div className="w-80 border-l bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-600" />
                      AI Guidance
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setAiGuidanceVisible(false)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-700 space-y-3">
                    <p>{currentGuidance}</p>

                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Quick Actions:</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Save to Files
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share with AI
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Bookmark className="h-4 w-4 mr-2" />
                          Add Bookmark
                        </Button>
                      </div>
                    </div>

                    {/* Bookmarks */}
                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Bookmarks:</h4>
                      <div className="space-y-1">
                        {bookmarks.map((bookmark, index) => (
                          <button
                            key={index}
                            className="w-full text-left text-sm p-2 hover:bg-gray-100 rounded"
                            onClick={() => navigateToUrl(bookmark.url)}
                          >
                            {bookmark.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
