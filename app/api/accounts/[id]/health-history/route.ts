import { NextRequest } from 'next/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const days = Number(request.nextUrl.searchParams.get('days') ?? '90')
    const since = new Date()
    since.setDate(since.getDate() - days)

    const db = createServiceClient()
    const { data, error } = await db
      .from('health_score_history')
      .select('id, account_id, score, signals, calculated_at')
      .eq('account_id', id)
      .gte('calculated_at', since.toISOString())
      .order('calculated_at', { ascending: true })

    if (error) throw error

    return Response.json({ history: data ?? [] })
  } catch (error) {
    console.error('GET /api/accounts/[id]/health-history error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
