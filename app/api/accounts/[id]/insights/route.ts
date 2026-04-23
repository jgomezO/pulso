import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: accountId } = await params
    const orgId = user.app_metadata?.org_id
    if (!orgId) {
      return Response.json({ error: 'No organization' }, { status: 403 })
    }

    const db = createServiceClient()
    const { data, error } = await db
      .from('copilot_insights')
      .select('*')
      .eq('account_id', accountId)
      .eq('org_id', orgId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return Response.json({ insights: data ?? [] })
  } catch (error) {
    console.error('GET /api/accounts/[id]/insights error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
