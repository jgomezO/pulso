import { NextRequest } from 'next/server'
import { z } from 'zod'
import { anthropic, AI_MODEL, AI_MAX_TOKENS_BRIEF } from '@/infrastructure/ai/anthropic'
import { MEETING_BRIEF_PROMPT } from '@/infrastructure/ai/prompts/meeting-brief.prompt'

const BodySchema = z.object({
  name: z.string(),
  arr: z.string(),
  healthScore: z.number(),
  trend: z.string(),
  renewalDate: z.string(),
  recentEvents: z.array(z.object({
    type: z.string(),
    title: z.string(),
    occurredAt: z.string(),
  })),
  openTickets: z.number(),
  usageSummary: z.string(),
  contacts: z.array(z.object({
    name: z.string(),
    role: z.string(),
    isChampion: z.boolean(),
    isDecisionMaker: z.boolean(),
  })),
  lastMeetingDate: z.string().nullable(),
  openRisks: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS_BRIEF,
      messages: [{ role: 'user', content: MEETING_BRIEF_PROMPT(parsed.data) }],
    })

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('POST /api/ai/brief error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
