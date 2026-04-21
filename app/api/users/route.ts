import { createServiceClient } from '@/infrastructure/db/supabase'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

export async function GET() {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const db = createServiceClient()

    // List users that belong to the same org
    const { data: profiles, error: profilesError } = await db
      .from('user_profiles')
      .select('id')
      .eq('org_id', auth.orgId)

    if (profilesError) throw profilesError

    const orgUserIds = new Set((profiles ?? []).map(p => p.id))

    const { data, error } = await db.auth.admin.listUsers()
    if (error) throw error

    const users = (data?.users ?? [])
      .filter(u => orgUserIds.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata?.full_name as string | undefined) ?? u.email ?? u.id,
      }))

    return Response.json({ users })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
