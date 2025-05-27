export interface FileOperation {
  type: "create" | "read" | "update" | "delete" | "list"
  path: string
  content?: string
  metadata?: Record<string, any>
}

export interface FileSystemEntry {
  name: string
  type: "file" | "directory"
  size?: number
  lastModified: Date
  content?: string
  metadata?: Record<string, any>
}

export class FileOperationsService {
  private virtualFileSystem: Map<string, FileSystemEntry> = new Map()

  constructor() {
    this.initializeVirtualFS()
  }

  private initializeVirtualFS() {
    // Initialize with some sample files
    this.virtualFileSystem.set("/README.md", {
      name: "README.md",
      type: "file",
      size: 256,
      lastModified: new Date(),
      content: `# Graei AI Virtual File System

This is a virtual file system for collaborative development with Graei AI.

## Features
- Create and edit files
- Share files between human and AI
- Version control
- Real-time collaboration

## Usage
Use terminal commands to interact with files:
- \`file <filename>\` - Create or edit a file
- \`cat <filename>\` - View file content
- \`ls\` - List files
- \`rm <filename>\` - Delete a file
`,
      metadata: { language: "markdown" },
    })

    this.virtualFileSystem.set("/examples/hello.js", {
      name: "hello.js",
      type: "file",
      size: 128,
      lastModified: new Date(),
      content: `// Hello World in JavaScript
console.log("Hello, World!");

function greet(name) {
    return \`Hello, \${name}! Welcome to Graei AI.\`;
}

console.log(greet("Developer"));
`,
      metadata: { language: "javascript" },
    })

    this.virtualFileSystem.set("/examples/styles.css", {
      name: "styles.css",
      type: "file",
      size: 200,
      lastModified: new Date(),
      content: `/* Graei AI Styles */
.ai-interface {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 20px;
    color: white;
}

.terminal {
    background: #1a1a1a;
    color: #00ff00;
    font-family: 'Courier New', monospace;
    padding: 15px;
    border-radius: 8px;
}

.file-editor {
    border: 1px solid #ddd;
    border-radius: 6px;
    font-family: 'Monaco', 'Menlo', monospace;
}
`,
      metadata: { language: "css" },
    })
  }

  async createFile(path: string, content = "", metadata?: Record<string, any>): Promise<FileSystemEntry> {
    const fileName = path.split("/").pop() || path
    const entry: FileSystemEntry = {
      name: fileName,
      type: "file",
      size: content.length,
      lastModified: new Date(),
      content,
      metadata: metadata || this.detectFileMetadata(fileName, content),
    }

    this.virtualFileSystem.set(path, entry)
    console.log(`📄 Created file: ${path}`)
    return entry
  }

  async readFile(path: string): Promise<FileSystemEntry | null> {
    const entry = this.virtualFileSystem.get(path)
    if (!entry) {
      console.log(`❌ File not found: ${path}`)
      return null
    }

    console.log(`📖 Reading file: ${path}`)
    return entry
  }

  async updateFile(path: string, content: string, metadata?: Record<string, any>): Promise<FileSystemEntry> {
    const existingEntry = this.virtualFileSystem.get(path)

    if (!existingEntry) {
      return this.createFile(path, content, metadata)
    }

    const updatedEntry: FileSystemEntry = {
      ...existingEntry,
      content,
      size: content.length,
      lastModified: new Date(),
      metadata: metadata || existingEntry.metadata || this.detectFileMetadata(existingEntry.name, content),
    }

    this.virtualFileSystem.set(path, updatedEntry)
    console.log(`✏️ Updated file: ${path}`)
    return updatedEntry
  }

  async deleteFile(path: string): Promise<boolean> {
    const existed = this.virtualFileSystem.has(path)
    this.virtualFileSystem.delete(path)

    if (existed) {
      console.log(`🗑️ Deleted file: ${path}`)
    } else {
      console.log(`❌ File not found for deletion: ${path}`)
    }

    return existed
  }

  async listFiles(directory = "/"): Promise<FileSystemEntry[]> {
    const entries: FileSystemEntry[] = []

    for (const [path, entry] of this.virtualFileSystem.entries()) {
      if (directory === "/" || path.startsWith(directory)) {
        entries.push({
          ...entry,
          name: path, // Include full path for listing
        })
      }
    }

    return entries.sort((a, b) => a.name.localeCompare(b.name))
  }

  async searchFiles(query: string): Promise<FileSystemEntry[]> {
    const results: FileSystemEntry[] = []

    for (const [path, entry] of this.virtualFileSystem.entries()) {
      const searchableContent = `${path} ${entry.content || ""}`.toLowerCase()
      if (searchableContent.includes(query.toLowerCase())) {
        results.push({
          ...entry,
          name: path,
        })
      }
    }

    return results
  }

  private detectFileMetadata(fileName: string, content: string): Record<string, any> {
    const extension = fileName.split(".").pop()?.toLowerCase()
    const metadata: Record<string, any> = {}

    // Detect language based on file extension
    const languageMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      md: "markdown",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
    }

    if (extension && languageMap[extension]) {
      metadata.language = languageMap[extension]
    }

    // Detect content characteristics
    metadata.lineCount = content.split("\n").length
    metadata.wordCount = content.split(/\s+/).filter((word) => word.length > 0).length
    metadata.characterCount = content.length

    // Detect if it's code
    const codeIndicators = ["function", "class", "import", "export", "const", "let", "var", "def", "public", "private"]
    metadata.isCode = codeIndicators.some((indicator) => content.includes(indicator))

    return metadata
  }

  async executeCode(
    path: string,
    language?: string,
  ): Promise<{
    success: boolean
    output: string
    error?: string
  }> {
    const file = await this.readFile(path)
    if (!file || !file.content) {
      return {
        success: false,
        output: "",
        error: `File not found or empty: ${path}`,
      }
    }

    const detectedLanguage = language || file.metadata?.language || "text"

    // Simulate code execution (in a real implementation, you'd use sandboxed execution)
    console.log(`🚀 Executing ${detectedLanguage} code from ${path}`)

    try {
      const result = await this.simulateCodeExecution(file.content, detectedLanguage)
      return result
    } catch (error) {
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unknown execution error",
      }
    }
  }

  private async simulateCodeExecution(
    content: string,
    language: string,
  ): Promise<{
    success: boolean
    output: string
    error?: string
  }> {
    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

    switch (language) {
      case "javascript":
        return this.simulateJavaScriptExecution(content)
      case "python":
        return this.simulatePythonExecution(content)
      case "html":
        return this.simulateHTMLExecution(content)
      default:
        return {
          success: true,
          output: `Code execution simulated for ${language}.\nContent length: ${content.length} characters\nLines: ${content.split("\n").length}`,
        }
    }
  }

  private simulateJavaScriptExecution(content: string): {
    success: boolean
    output: string
    error?: string
  } {
    try {
      // Simple simulation - look for console.log statements
      const consoleOutputs = content.match(/console\.log$$['"`]([^'"`]*)['"`]$$/g) || []
      const outputs = consoleOutputs.map((match) => {
        const message = match.match(/console\.log$$['"`]([^'"`]*)['"`]$$/)?.[1] || ""
        return message
      })

      if (outputs.length > 0) {
        return {
          success: true,
          output: outputs.join("\n"),
        }
      }

      return {
        success: true,
        output: "JavaScript code executed successfully (no console output detected)",
      }
    } catch (error) {
      return {
        success: false,
        output: "",
        error: "JavaScript execution simulation failed",
      }
    }
  }

  private simulatePythonExecution(content: string): {
    success: boolean
    output: string
    error?: string
  } {
    try {
      // Simple simulation - look for print statements
      const printOutputs = content.match(/print$$['"`]([^'"`]*)['"`]$$/g) || []
      const outputs = printOutputs.map((match) => {
        const message = match.match(/print$$['"`]([^'"`]*)['"`]$$/)?.[1] || ""
        return message
      })

      if (outputs.length > 0) {
        return {
          success: true,
          output: outputs.join("\n"),
        }
      }

      return {
        success: true,
        output: "Python code executed successfully (no print output detected)",
      }
    } catch (error) {
      return {
        success: false,
        output: "",
        error: "Python execution simulation failed",
      }
    }
  }

  private simulateHTMLExecution(content: string): {
    success: boolean
    output: string
    error?: string
  } {
    const titleMatch = content.match(/<title>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : "Untitled"

    const bodyContent = content.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || "No body content"

    return {
      success: true,
      output: `HTML Document Rendered:
Title: ${title}
Body Content Preview: ${bodyContent.substring(0, 200)}...`,
    }
  }

  // Get file statistics
  getFileSystemStats(): {
    totalFiles: number
    totalSize: number
    fileTypes: Record<string, number>
    lastModified: Date | null
  } {
    let totalFiles = 0
    let totalSize = 0
    const fileTypes: Record<string, number> = {}
    let lastModified: Date | null = null

    for (const [path, entry] of this.virtualFileSystem.entries()) {
      if (entry.type === "file") {
        totalFiles++
        totalSize += entry.size || 0

        const extension = entry.name.split(".").pop()?.toLowerCase() || "unknown"
        fileTypes[extension] = (fileTypes[extension] || 0) + 1

        if (!lastModified || entry.lastModified > lastModified) {
          lastModified = entry.lastModified
        }
      }
    }

    return {
      totalFiles,
      totalSize,
      fileTypes,
      lastModified,
    }
  }
}

export const fileOperationsService = new FileOperationsService()
