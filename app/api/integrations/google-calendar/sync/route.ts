import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { GoogleCalendarClient } from '@/infrastructure/integrations/google-calendar/GoogleCalendarClient'
import { SyncGoogleCalendar } from '@/application/integrations/SyncGoogleCalendar'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'

export async function POST() {
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

    // Get stored tokens
    const { data: config } = await serviceClient
      .from('integration_configs')
      .select('credentials')
      .eq('org_id', profile.org_id)
      .eq('type', 'google_calendar')
      .eq('is_active', true)
      .single()

    if (!config?.credentials) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    const { access_token, refresh_token } = config.credentials as {
      access_token: string
      refresh_token: string
    }

    const calendarClient = new GoogleCalendarClient(access_token, refresh_token)

    // Simple account repository adapter
    const accountRepo = {
      async findByOrgId(orgId: string) {
        const { data } = await serviceClient
          .from('accounts')
          .select('id, domain')
          .eq('org_id', orgId)
        return data ?? []
      },
    }

    const userEmail = user.email ?? ''
    const userDomain = userEmail.split('@')[1]

    const syncUseCase = new SyncGoogleCalendar(
      new EventRepositorySupabase(),
      accountRepo,
      calendarClient
    )

    const result = await syncUseCase.execute(profile.org_id, userDomain)

    // Update access token if it was refreshed
    const updatedToken = calendarClient.getUpdatedAccessToken()
    if (updatedToken !== access_token) {
      await serviceClient
        .from('integration_configs')
        .update({
          credentials: { ...config.credentials, access_token: updatedToken },
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', profile.org_id)
        .eq('type', 'google_calendar')
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('POST /api/integrations/google-calendar/sync error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
