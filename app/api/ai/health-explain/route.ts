import { NextRequest } from 'next/server'
import { z } from 'zod'
import { streamHealthExplanation } from '@/infrastructure/ai/HealthScoreExplainer'

const BodySchema = z.object({
  accountName: z.string(),
  score: z.number(),
  previousScore: z.number().nullable(),
  signals: z.object({
    productUsageScore: z.number(),
    supportHealthScore: z.number(),
    engagementScore: z.number(),
    npsScore: z.number().nullable(),
    paymentScore: z.number(),
    stakeholderScore: z.number(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const stream = await streamHealthExplanation(parsed.data)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('POST /api/ai/health-explain error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
