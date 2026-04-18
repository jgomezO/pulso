import { NextRequest } from 'next/server'
import { z } from 'zod'
import { AccountRepositorySupabase } from '@/infrastructure/db/AccountRepositorySupabase'
import { CalculateHealthScore } from '@/application/accounts/CalculateHealthScore'
import { createServiceClient } from '@/infrastructure/db/supabase'

const BodySchema = z.object({
  orgId: z.string().uuid(),
  signals: z.object({
    productUsageScore: z.number().min(0).max(100),
    supportHealthScore: z.number().min(0).max(100),
    engagementScore: z.number().min(0).max(100),
    npsScore: z.number().min(0).max(100).nullable(),
    paymentScore: z.number().min(0).max(100),
    stakeholderScore: z.number().min(0).max(100),
  }),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = createServiceClient()

    const { data, error } = await db
      .from('health_score_history')
      .select('*')
      .eq('account_id', id)
      .order('calculated_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return Response.json({ history: data ?? [] })
  } catch (error) {
    console.error('GET /api/accounts/[id]/health error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const useCase = new CalculateHealthScore(new AccountRepositorySupabase())
    const result = await useCase.execute(id, parsed.data.orgId, parsed.data.signals)

    return Response.json(result)
  } catch (error) {
    console.error('POST /api/accounts/[id]/health error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
