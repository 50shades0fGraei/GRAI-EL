export const NVIDIA_MODELS = {
  "llama-3.1-nemotron-70b": "nvidia/llama-3.1-nemotron-70b-instruct",
  "llama-3.1-405b": "meta/llama-3.1-405b-instruct",
  "llama-3.1-70b": "meta/llama-3.1-70b-instruct",
  "llama-3.1-8b": "meta/llama-3.1-8b-instruct",
  "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct-v0.1",
} as const

export type NvidiaModel = keyof typeof NVIDIA_MODELS

export const DEFAULT_MODEL: NvidiaModel = "llama-3.1-nemotron-70b"

export const NVIDIA_API_BASE_URL = "https://integrate.api.nvidia.com/v1"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface NvidiaApiRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}
