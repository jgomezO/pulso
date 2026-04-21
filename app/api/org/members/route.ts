import { createServiceClient } from '@/infrastructure/db/supabase'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

export async function GET() {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const db = createServiceClient()

    const { data: profiles, error } = await db
      .from('user_profiles')
      .select('id, role, created_at')
      .eq('org_id', auth.orgId)

    if (error) throw error

    // Get user details from auth
    const { data: usersData } = await db.auth.admin.listUsers()
    const usersMap = new Map(
      (usersData?.users ?? []).map(u => [u.id, {
        email: u.email ?? '',
        name: (u.user_metadata?.full_name as string | undefined) ?? u.email ?? u.id,
        avatarUrl: u.user_metadata?.avatar_url as string | undefined,
      }])
    )

    const members = (profiles ?? []).map(p => ({
      id: p.id,
      role: p.role,
      joinedAt: p.created_at,
      ...usersMap.get(p.id) ?? { email: '', name: p.id },
    }))

    return Response.json({ members })
  } catch (error) {
    console.error('GET /api/org/members error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
