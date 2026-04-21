import { createServiceClient } from '@/infrastructure/db/supabase'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

export async function GET() {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const orgId = auth.orgId
    const db = createServiceClient()

    const { data: accounts, error } = await db
      .from('accounts')
      .select('id, name, arr, health_score, renewal_date, risk_level, health_trend, created_at')
      .eq('org_id', orgId)
      .is('archived_at', null)

    if (error) throw error

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const total       = accounts.length
    const newThisMonth = accounts.filter(a => a.created_at >= monthStart).length
    const totalArr    = accounts.reduce((sum, a) => sum + (a.arr ?? 0), 0)
    const avgArr      = total > 0 ? Math.round(totalArr / total) : 0

    const atRisk      = accounts.filter(a => (a.health_score ?? 100) < 40)
    const atRiskArr   = atRisk.reduce((sum, a) => sum + (a.arr ?? 0), 0)

    const in90Days = new Date(now); in90Days.setDate(in90Days.getDate() + 90)
    const renewing = accounts
      .filter(a => {
        if (!a.renewal_date) return false
        const d = new Date(a.renewal_date)
        return d >= now && d <= in90Days
      })
      .sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime())

    const nextRenewal = renewing[0] ?? null
    const nextRenewalDays = nextRenewal
      ? Math.ceil((new Date(nextRenewal.renewal_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return Response.json({
      totalAccounts: total,
      newThisMonth,
      totalArr,
      avgArr,
      atRiskCount: atRisk.length,
      atRiskArr,
      renewingCount: renewing.length,
      nextRenewalName: nextRenewal?.name ?? null,
      nextRenewalDays,
    })
  } catch (error) {
    console.error('GET /api/dashboard/kpis error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
