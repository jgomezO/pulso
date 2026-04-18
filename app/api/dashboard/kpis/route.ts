import { NextRequest } from 'next/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    if (!orgId) return Response.json({ error: 'orgId required' }, { status: 400 })

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
