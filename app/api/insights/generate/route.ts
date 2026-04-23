import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { getAccountContext } from '@/application/accounts/GetAccountContext'
import { detectInsights } from '@/lib/copilot/insight-detector'

const GenerateSchema = z.object({
  accountId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const orgId = user.app_metadata?.org_id
    if (!orgId) {
      return Response.json({ error: 'No organization' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = GenerateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { accountId } = parsed.data

    // Verify account belongs to org
    const db = createServiceClient()
    const { data: account } = await db
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .eq('org_id', orgId)
      .single()

    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get context and detect insights
    const ctx = await getAccountContext(accountId)
    const detected = detectInsights(ctx)

    // Upsert insights (unique on account_id + type + title)
    let inserted = 0
    for (const insight of detected) {
      const { error } = await db
        .from('copilot_insights')
        .upsert(
          {
            account_id: accountId,
            org_id: orgId,
            type: insight.type,
            severity: insight.severity,
            title: insight.title,
            description: insight.description,
            data: insight.data,
            expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
          },
          { onConflict: 'account_id,type,title' }
        )

      if (!error) inserted++
    }

    return Response.json({ generated: inserted, total: detected.length })
  } catch (error) {
    console.error('POST /api/insights/generate error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
