import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { generateAuthUrl } from '@/infrastructure/integrations/google-calendar/GoogleCalendarOAuth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const authUrl = generateAuthUrl(profile.org_id)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('GET /api/integrations/google-calendar/auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
