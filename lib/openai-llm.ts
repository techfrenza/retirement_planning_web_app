import 'server-only'
import OpenAI from 'openai'

export function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  })
}

export const OPENAI_MODEL_DEFAULT = 'gpt-4o'
