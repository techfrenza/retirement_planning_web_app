import { NextRequest } from 'next/server'
import { streamLLMMessage } from '../../../lib/llm'
import type { LLMMessage } from '../../../lib/llm'
import type { SimulationContext } from '../../../src/engine/types'

export const dynamic = 'force-dynamic'

interface RequestBody {
  messages: LLMMessage[]
  simulationContext: SimulationContext
}

function buildSystemPrompt(ctx: SimulationContext): string {
  const survivalPct = (ctx.survivalProbability * 100).toFixed(0)
  const p50M = (ctx.p50Final / 1_000_000).toFixed(2)
  const p10M = (ctx.p10Final / 1_000_000).toFixed(2)
  const p90M = (ctx.p90Final / 1_000_000).toFixed(2)
  const withdrawalStr = ctx.withdrawalRules
    .map((r) => `if market return ≥ ${r.threshold}%, withdraw ${r.rate}%`)
    .join('; ')

  return `You are a retirement planning advisor. The user has just run a Monte Carlo simulation with these results:

- Starting portfolio: $${(ctx.portfolioValue / 1_000_000).toFixed(2)}M
- Projection horizon: ${ctx.projectionYears} years
- Probability of portfolio lasting the full period: ${survivalPct}%
- Withdrawal strategy: ${withdrawalStr}
- Year 1 median withdrawal: $${(ctx.medianWithdrawalYear1 / 1_000).toFixed(0)}K
- At year ${ctx.projectionYears}: median (p50) = $${p50M}M, pessimistic (p10) = $${p10M}M, optimistic (p90) = $${p90M}M

Answer the user's questions about their retirement plan clearly and concisely. Use plain language. Do not give specific investment advice or legal/tax guidance. Focus on helping interpret the simulation results.`
}

export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.json()) as RequestBody
  const { messages, simulationContext } = body

  const systemPrompt = buildSystemPrompt(simulationContext)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamLLMMessage(messages, systemPrompt)) {
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'LLM error'
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
