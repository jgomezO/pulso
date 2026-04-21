import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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

    const { data: config } = await serviceClient
      .from('integration_configs')
      .select('is_active, updated_at')
      .eq('org_id', profile.org_id)
      .eq('type', 'google_calendar')
      .single()

    return NextResponse.json({
      connected: !!config?.is_active,
      lastSync: config?.updated_at ?? null,
    })
  } catch (error) {
    console.error('GET /api/integrations/google-calendar/status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
