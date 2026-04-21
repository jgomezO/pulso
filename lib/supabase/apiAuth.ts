import { createClient } from '@/lib/supabase/server'

interface AuthSuccess {
  ok: true
  orgId: string
  userId: string
}

interface AuthFailure {
  ok: false
  error: string
  status: number
}

export type AuthResult = AuthSuccess | AuthFailure

/**
 * Authenticates the request and returns the org_id from JWT.
 * Use: const auth = await authenticateRequest()
 *      if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
 *      // auth.orgId and auth.userId are now string
 */
export async function authenticateRequest(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false, error: 'Not authenticated', status: 401 }
  }

  const orgId = user.app_metadata?.org_id as string | undefined
  if (!orgId) {
    return { ok: false, error: 'Organization not configured. Please log out and log in again.', status: 403 }
  }

  return { ok: true, orgId, userId: user.id }
}
