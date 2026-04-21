import { createClient } from '@/lib/supabase/server'

/**
 * Extracts the org_id from the authenticated user's app_metadata (JWT).
 * Use this in all API routes instead of accepting orgId from the client.
 * Returns null if not authenticated or org_id not set.
 */
export async function getOrgId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const orgId = user.app_metadata?.org_id as string | undefined
  return orgId ?? null
}

/**
 * Like getOrgId but throws if not authenticated or org not set.
 * Use in API routes where auth is required.
 */
export async function requireOrgId(): Promise<string> {
  const orgId = await getOrgId()
  if (!orgId) {
    throw new Error('UNAUTHORIZED')
  }
  return orgId
}
