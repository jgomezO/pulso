import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

const CreateOrgSchema = z.object({
  orgName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
})

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = CreateOrgSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { orgName } = parsed.data
  const serviceClient = createServiceClient()

  // Check if user already has a profile (idempotent)
  const { data: existing } = await serviceClient
    .from('user_profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ orgId: existing.org_id })
  }

  // Create org + profile atomically
  const orgSlug = `org-${user.id.slice(0, 8)}-${Date.now()}`

  const { data: result, error: rpcError } = await serviceClient.rpc('ensure_user_org', {
    p_user_id: user.id,
    p_org_name: orgName,
    p_org_slug: orgSlug,
  })

  if (rpcError || !result) {
    console.error('create-org: rpc ensure_user_org failed', rpcError)
    return NextResponse.json(
      { error: 'Failed to create organization', details: rpcError?.message },
      { status: 500 }
    )
  }

  const orgId = result.org_id as string

  // Set org_id in JWT app_metadata for RLS
  await serviceClient.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, org_id: orgId },
  })

  return NextResponse.json({ orgId })
}
