import { createServiceClient } from '@/infrastructure/db/supabase'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

export async function GET() {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const orgId = auth.orgId
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
