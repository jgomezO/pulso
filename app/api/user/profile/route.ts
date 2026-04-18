import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

const ProfileResponseSchema = z.object({
  orgName: z.string(),
  role: z.string(),
})

type ProfileResponse = z.infer<typeof ProfileResponseSchema>

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  const { data: profile, error: profileError } = await serviceClient
    .from('user_profiles')
    .select('role, organizations(name)')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const org = profile.organizations as unknown as { name: string } | null

  const response: ProfileResponse = {
    orgName: org?.name ?? 'Sin organización',
    role: profile.role,
  }

  const parsed = ProfileResponseSchema.safeParse(response)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile data' }, { status: 500 })
  }

  return NextResponse.json(parsed.data)
}
