import { NextRequest } from 'next/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    if (!orgId) {
      return Response.json({ error: 'orgId required' }, { status: 400 })
    }

    const db = createServiceClient()
    const { data, error } = await db.auth.admin.listUsers()

    if (error) throw error

    const users = (data?.users ?? []).map((u) => ({
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
