import { NextRequest } from 'next/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    if (!orgId) return Response.json({ error: 'orgId required' }, { status: 400 })

    const db = createServiceClient()

    const { data, error } = await db
      .from('success_plans')
      .select('id, title, progress, target_date, status, account_id, accounts!inner(name, org_id)')
      .eq('accounts.org_id', orgId)
      .eq('status', 'active')
      .order('target_date', { ascending: true, nullsFirst: false })
      .limit(6)

    if (error) throw error

    const plans = (data ?? []).map((row: Record<string, unknown>) => {
      const acct = row.accounts as { name?: string } | null
      return {
        id:          row.id,
        title:       row.title,
        progress:    row.progress,
        targetDate:  row.target_date,
        accountId:   row.account_id,
        accountName: acct?.name ?? null,
      }
    })

    return Response.json({ plans })
  } catch (err) {
    console.error('GET /api/dashboard/plans error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
