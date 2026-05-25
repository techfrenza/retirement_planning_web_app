'use client'

import { useState, useRef, useEffect } from 'react'
import type { SimulationOutput, SimulationInput, SimulationContext } from '../engine/types'
import type { LLMMessage } from '../../lib/llm'

interface Props {
  results: SimulationOutput
  input: SimulationInput
}

const QUICK_QUESTIONS = [
  'What does my survival probability mean?',
  'Am I withdrawing too aggressively?',
  'What happens in a bear market scenario?',
]

function extractContext(
  results: SimulationOutput,
  input: SimulationInput,
): SimulationContext {
  const lastIdx = input.projectionYears - 1
  const year1Withdrawals = results.runs
    .map((r) => r[0]?.withdrawal ?? 0)
    .sort((a, b) => a - b)
  const medianWithdrawalYear1 =
    year1Withdrawals[Math.floor(year1Withdrawals.length / 2)] ?? 0

  return {
    portfolioValue: input.portfolioValue,
    survivalProbability: results.survivalProbability,
    withdrawalRules: input.withdrawalRules,
    projectionYears: input.projectionYears,
    p50Final: results.percentiles.p50[lastIdx] ?? 0,
    p10Final: results.percentiles.p10[lastIdx] ?? 0,
    p90Final: results.percentiles.p90[lastIdx] ?? 0,
    medianWithdrawalYear1,
  }
}

export function AdvisorPanel({ results, input }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<LLMMessage[]>([])
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const sendMessage = async (overrideDraft?: string) => {
    const text = (overrideDraft ?? draft).trim()
    if (!text || streaming) return

    const userMessage: LLMMessage = { role: 'user', content: text }
    const nextMessages: LLMMessage[] = [...messages, userMessage]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setDraft('')
    setStreaming(true)
    setError(null)

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          simulationContext: extractContext(results, input),
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages([
          ...nextMessages,
          { role: 'assistant', content: assistantContent },
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response')
      setMessages(nextMessages)
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 text-lg">✦</span>
          <span className="text-white font-semibold">Ask AI Advisor</span>
          <span className="text-slate-400 text-sm">— ask questions about your results</span>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-700">
          {/* Quick questions */}
          {messages.length === 0 && (
            <div className="px-6 py-4 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={streaming}
                  className="px-3 py-1.5 bg-indigo-900/40 border border-indigo-700 text-indigo-300 rounded-full text-xs hover:bg-indigo-800/50 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat area */}
          {messages.length > 0 && (
            <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <span className="text-indigo-400 text-sm mt-0.5 shrink-0">✦</span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/60 text-slate-200'
                    }`}
                  >
                    {msg.content || (
                      streaming && i === messages.length - 1 ? (
                        <span className="inline-flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-6 mb-3 px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 hover:text-red-300">✕</button>
            </div>
          )}

          {/* Input */}
          <div className="px-6 pb-5 flex gap-3 items-end">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder="Ask about your retirement plan… (Enter to send)"
              rows={2}
              className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 placeholder-slate-500"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!draft.trim() || streaming}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors shrink-0"
            >
              {streaming ? '…' : 'Send →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
