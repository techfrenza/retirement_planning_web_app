import 'server-only'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { getAnthropicClient, getAnthropicModel } from './claude'
import { getOpenAIClient, OPENAI_MODEL_DEFAULT } from './openai-llm'

export type LLMProvider = 'anthropic' | 'openai'
export type LLMMessage = { role: 'user' | 'assistant'; content: string }

function getProvider(): LLMProvider {
  return process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'anthropic'
}

export async function callLLM(
  messages: LLMMessage[],
  systemPrompt?: string,
): Promise<string> {
  if (getProvider() === 'openai') {
    const completion = await getOpenAIClient().chat.completions.create({
      model: OPENAI_MODEL_DEFAULT,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
    })
    return completion.choices[0]?.message.content ?? ''
  }

  const anthropicMessages: MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
  const response = await getAnthropicClient().messages.create({
    model: getAnthropicModel(),
    max_tokens: 2048,
    system: systemPrompt,
    messages: anthropicMessages,
  })
  const block = response.content[0]
  return block?.type === 'text' ? block.text : ''
}

export async function* streamLLMMessage(
  messages: LLMMessage[],
  systemPrompt?: string,
): AsyncGenerator<string> {
  if (getProvider() === 'openai') {
    const stream = await getOpenAIClient().chat.completions.create({
      model: OPENAI_MODEL_DEFAULT,
      stream: true,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
    })
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta.content
      if (delta) yield delta
    }
    return
  }

  const anthropicMessages: MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
  const stream = getAnthropicClient().messages.stream({
    model: getAnthropicModel(),
    max_tokens: 2048,
    system: systemPrompt,
    messages: anthropicMessages,
  })
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}
