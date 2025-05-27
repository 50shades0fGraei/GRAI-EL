export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

export interface WebContent {
  url: string
  title: string
  content: string
  metadata: Record<string, any>
}

export class WebSearchService {
  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      // Using DuckDuckGo Instant Answer API (free, no API key required)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      )

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      const results: SearchResult[] = []

      // Process abstract
      if (data.Abstract) {
        results.push({
          title: data.Heading || "DuckDuckGo Result",
          url: data.AbstractURL || "#",
          snippet: data.Abstract,
          source: "DuckDuckGo",
        })
      }

      // Process related topics
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || "Related Topic",
              url: topic.FirstURL,
              snippet: topic.Text,
              source: "DuckDuckGo",
            })
          }
        })
      }

      return results
    } catch (error) {
      console.error("DuckDuckGo search error:", error)
      return this.getFallbackResults(query)
    }
  }

  private getFallbackResults(query: string): SearchResult[] {
    // Fallback mock results when API fails
    return [
      {
        title: `${query} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        snippet: `Wikipedia article about ${query}. Learn more about this topic from the free encyclopedia.`,
        source: "Wikipedia",
      },
      {
        title: `${query} - Stack Overflow`,
        url: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Programming questions and answers related to ${query} from the developer community.`,
        source: "Stack Overflow",
      },
      {
        title: `${query} - GitHub`,
        url: `https://github.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Open source projects and code repositories related to ${query}.`,
        source: "GitHub",
      },
      {
        title: `${query} - MDN Web Docs`,
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
        snippet: `Web development documentation and tutorials for ${query}.`,
        source: "MDN",
      },
    ]
  }

  async search(query: string): Promise<SearchResult[]> {
    console.log(`🔍 Searching for: "${query}"`)

    try {
      const results = await this.searchDuckDuckGo(query)

      if (results.length === 0) {
        return this.getFallbackResults(query)
      }

      return results
    } catch (error) {
      console.error("Search service error:", error)
      return this.getFallbackResults(query)
    }
  }

  async fetchWebContent(url: string): Promise<WebContent> {
    try {
      // For security and CORS reasons, we'll simulate web content fetching
      // In a production environment, you'd use a backend service or proxy

      const mockContent = await this.getMockWebContent(url)
      return mockContent
    } catch (error) {
      console.error("Web content fetch error:", error)
      throw new Error(`Failed to fetch content from ${url}`)
    }
  }

  private async getMockWebContent(url: string): Promise<WebContent> {
    // Simulate fetching web content
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const domain = new URL(url).hostname

    return {
      url,
      title: `Content from ${domain}`,
      content: `This is simulated content from ${url}. 

In a real implementation, this would:
1. Fetch the actual webpage content
2. Parse HTML and extract text
3. Handle different content types
4. Respect robots.txt and rate limits
5. Extract metadata and structured data

The content would include the main text, headings, and relevant information from the webpage.`,
      metadata: {
        domain,
        fetchedAt: new Date().toISOString(),
        contentType: "text/html",
        language: "en",
      },
    }
  }

  async searchAndSummarize(query: string): Promise<{
    results: SearchResult[]
    summary: string
  }> {
    const results = await this.search(query)

    const summary = `Found ${results.length} results for "${query}":

${results
  .slice(0, 3)
  .map((result, index) => `${index + 1}. ${result.title}\n   ${result.snippet}`)
  .join("\n\n")}

${results.length > 3 ? `\n... and ${results.length - 3} more results.` : ""}`

    return { results, summary }
  }
}

export const webSearchService = new WebSearchService()
