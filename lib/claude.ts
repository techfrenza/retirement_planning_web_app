import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

export function getAnthropicClient(): Anthropic {
  return new Anthropic(
    process.env.ANTHROPIC_AUTH_TOKEN
      // SAP Hyperspace proxy: Authorization: Bearer (NOT x-api-key)
      ? { authToken: process.env.ANTHROPIC_AUTH_TOKEN, baseURL: process.env.ANTHROPIC_BASE_URL }
      // Direct Anthropic: x-api-key header
      : { apiKey: process.env.ANTHROPIC_API_KEY },
  )
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL_DEFAULT ?? 'claude-sonnet-4-5'
}
