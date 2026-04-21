import { NextRequest } from 'next/server'
import { AccountRepositorySupabase } from '@/infrastructure/db/AccountRepositorySupabase'
import { SignalValuesRepository } from '@/infrastructure/db/SignalValuesRepository'
import { HealthScoreConfigRepository } from '@/infrastructure/db/HealthScoreConfigRepository'
import { calculateScore } from '@/lib/health-score/configCalculator'
import { getHealthTrend, getRiskLevel } from '@/lib/health-score/calculator'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id } = await params
    const orgId = auth.orgId

    const [values, signals, account] = await Promise.all([
      new SignalValuesRepository().getByAccountId(id),
      new HealthScoreConfigRepository().getConfig(orgId),
      new AccountRepositorySupabase().findById(id, orgId),
    ])

    if (!account) return Response.json({ error: 'Account not found' }, { status: 404 })

    const newScore = calculateScore(values, signals)
    const trend = getHealthTrend(newScore, account.healthScore ?? null)
    const riskLevel = getRiskLevel(newScore)

    const db = createServiceClient()
    const signalsMap = Object.fromEntries(values.map(v => [v.key, v.value]))

    await db.from('health_score_history').insert({
      account_id: id,
      score: newScore,
      signals: signalsMap,
      calculated_at: new Date().toISOString(),
    })

    await new AccountRepositorySupabase().update(id, orgId, {
      healthScore: newScore,
      healthTrend: trend,
      riskLevel,
    })

    return Response.json({ score: newScore, trend, riskLevel })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('recalculate error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
