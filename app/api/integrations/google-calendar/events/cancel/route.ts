import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { GoogleCalendarClient } from '@/infrastructure/integrations/google-calendar/GoogleCalendarClient'

const CancelSchema = z.object({
  eventId: z.string().uuid(),
  googleEventId: z.string().min(1),
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const parsed = CancelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { eventId, googleEventId } = parsed.data

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

    // Delete from Google Calendar
    const calendarClient = new GoogleCalendarClient(access_token, refresh_token)
    await calendarClient.deleteEvent(googleEventId)

    // Update Pulso event: mark as cancelled
    const { error: updateError } = await serviceClient
      .from('account_events')
      .update({
        metadata: {
          googleEventId,
          cancelled: true,
        },
      })
      .eq('id', eventId)

    if (updateError) {
      console.error('Failed to update event:', updateError)
      return NextResponse.json({ error: 'Event cancelled in Google but failed to update locally' }, { status: 500 })
    }

    // Update token if refreshed
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

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/integrations/google-calendar/events/cancel error:', error)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
