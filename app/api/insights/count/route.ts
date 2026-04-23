import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function GET(request: Request) {
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

    const url = new URL(request.url)
    const accountId = url.searchParams.get('accountId')
    if (!accountId) {
      return Response.json({ error: 'accountId required' }, { status: 400 })
    }

    const db = createServiceClient()
    const { count, error } = await db
      .from('copilot_insights')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('org_id', orgId)
      .eq('is_read', false)
      .eq('is_dismissed', false)

    if (error) throw error

    return Response.json({ count: count ?? 0 })
  } catch (error) {
    console.error('GET /api/insights/count error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
