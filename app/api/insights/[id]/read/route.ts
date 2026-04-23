import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const orgId = user.app_metadata?.org_id
    if (!orgId) {
      return Response.json({ error: 'No organization' }, { status: 403 })
    }

    const db = createServiceClient()
    const { error } = await db
      .from('copilot_insights')
      .update({ is_read: true })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/insights/[id]/read error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
