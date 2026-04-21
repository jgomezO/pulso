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
    // Ensure app_metadata has org_id (idempotent)
    if (user.app_metadata?.org_id !== profile.org_id) {
      await serviceClient.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, org_id: profile.org_id },
      })
    }

    const response: EnsureOrgResponse = { orgId: profile.org_id, isNewUser: false }
    return NextResponse.json(response)
  }

  // Check if user was invited to an existing org
  const invitedOrgId = user.user_metadata?.invited_org_id as string | undefined
  const invitedRole = (user.user_metadata?.invited_role as string | undefined) ?? 'member'

  if (invitedOrgId) {
    // Verify the org exists
    const { data: org } = await serviceClient
      .from('organizations')
      .select('id')
      .eq('id', invitedOrgId)
      .single()

    if (org) {
      // Create profile linking user to the invited org
      const { error: profileError } = await serviceClient
        .from('user_profiles')
        .insert({ id: user.id, org_id: invitedOrgId, role: invitedRole })

      if (profileError) {
        console.error('ensure-org: failed to create invited user profile', profileError)
        return NextResponse.json(
          { error: 'Failed to create user profile', details: profileError.message },
          { status: 500 }
        )
      }

      // Set org_id in JWT and clear invite metadata
      await serviceClient.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, org_id: invitedOrgId },
        user_metadata: { ...user.user_metadata, invited_org_id: undefined, invited_role: undefined },
      })

      const response: EnsureOrgResponse = { orgId: invitedOrgId, isNewUser: true }
      return NextResponse.json(response)
    }
  }

  // New user without invite: create organization + profile
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

  // Set org_id in JWT app_metadata so RLS policies can use it
  await serviceClient.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, org_id: org.id },
  })

  const response: EnsureOrgResponse = { orgId: org.id, isNewUser: true }
  return NextResponse.json(response)
}
