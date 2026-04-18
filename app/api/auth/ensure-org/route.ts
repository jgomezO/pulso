import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

interface EnsureOrgResponse {
  orgId: string
  isNewUser: boolean
}

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // Check if user already has a profile with org
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (profile) {
    const response: EnsureOrgResponse = { orgId: profile.org_id, isNewUser: false }
    return NextResponse.json(response)
  }

  // New user: create organization + profile
  const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Usuario'
  const orgName = `${userName} Org`
  const orgSlug = `org-${user.id.slice(0, 8)}-${Date.now()}`

  const { data: org, error: orgError } = await serviceClient
    .from('organizations')
    .insert({ name: orgName, slug: orgSlug })
    .select('id')
    .single()

  if (orgError || !org) {
    console.error('ensure-org: failed to create organization', orgError)
    return NextResponse.json(
      { error: 'Failed to create organization', details: orgError?.message },
      { status: 500 }
    )
  }

  const { error: profileError } = await serviceClient
    .from('user_profiles')
    .insert({ id: user.id, org_id: org.id, role: 'admin' })

  if (profileError) {
    console.error('ensure-org: failed to create user profile', profileError)
    return NextResponse.json(
      { error: 'Failed to create user profile', details: profileError.message },
      { status: 500 }
    )
  }

  const response: EnsureOrgResponse = { orgId: org.id, isNewUser: true }
  return NextResponse.json(response)
}
