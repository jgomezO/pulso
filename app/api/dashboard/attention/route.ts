import { NextRequest } from 'next/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

interface AttentionAccount {
  id: string
  name: string
  healthScore: number | null
  healthTrend: string | null
  arr: number | null
  renewalDate: string | null
  riskLevel: string | null
  reasons: string[]
  urgency: number
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    if (!orgId) return Response.json({ error: 'orgId required' }, { status: 400 })

    const db = createServiceClient()
    const now = new Date()
    const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30)
    const today = now.toISOString().split('T')[0]

    const [{ data: accounts }, { data: overdueTasks }] = await Promise.all([
      db
        .from('accounts')
        .select('id, name, arr, health_score, renewal_date, risk_level, health_trend')
        .eq('org_id', orgId)
        .is('archived_at', null),
      db
        .from('account_tasks')
        .select('account_id')
        .lt('due_date', today)
        .in('status', ['pending', 'in_progress']),
    ])

    const overdueAccountIds = new Set((overdueTasks ?? []).map(t => t.account_id))

    const scored: AttentionAccount[] = []

    for (const a of accounts ?? []) {
      const reasons: string[] = []
      let urgency = 0
      const score = a.health_score ?? null
      const renewal = a.renewal_date ? new Date(a.renewal_date) : null

      // Score < 40 → critical
      if (score !== null && score < 40) {
        reasons.push('Score crítico')
        urgency += 40
      }
      // Declining trend
      if (a.health_trend === 'declining') {
        reasons.push('Score en declive')
        urgency += 20
      }
      // Renewal < 30 days and score < 70
      if (renewal && renewal >= now && renewal <= in30Days && (score === null || score < 70)) {
        const days = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        reasons.push(`Renueva en ${days}d`)
        urgency += 30
      }
      // Overdue tasks
      if (overdueAccountIds.has(a.id)) {
        reasons.push('Tareas vencidas')
        urgency += 10
      }

      if (urgency > 0) {
        scored.push({
          id: a.id,
          name: a.name,
          healthScore: score,
          healthTrend: a.health_trend,
          arr: a.arr,
          renewalDate: a.renewal_date,
          riskLevel: a.risk_level,
          reasons,
          urgency,
        })
      }
    }

    scored.sort((a, b) => b.urgency - a.urgency)

    return Response.json({ accounts: scored.slice(0, 5) })
  } catch (error) {
    console.error('GET /api/dashboard/attention error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
