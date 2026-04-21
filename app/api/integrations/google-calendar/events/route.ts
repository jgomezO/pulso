import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { GoogleCalendarClient } from '@/infrastructure/integrations/google-calendar/GoogleCalendarClient'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'

const CreateEventSchema = z.object({
  accountId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  startDateTime: z.string(), // ISO datetime
  endDateTime: z.string(),   // ISO datetime
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).min(1),
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
    const parsed = CreateEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { accountId, title, description, startDateTime, endDateTime, attendees } = parsed.data

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

    // Create event in Google Calendar with Meet link
    const googleEvent = await calendarClient.createEvent({
      summary: title,
      description,
      startDateTime,
      endDateTime,
      attendees: attendees.map((a) => ({ email: a.email, displayName: a.name })),
      createMeetLink: true,
    })

    const meetLink = (googleEvent as unknown as Record<string, unknown>).hangoutLink as string | undefined

    // Save event in Pulso
    const eventRepo = new EventRepositorySupabase()
    const pulsoEvent = await eventRepo.create({
      accountId,
      type: 'meeting',
      source: 'google_calendar',
      title,
      description: description ?? null,
      occurredAt: startDateTime,
      metadata: {
        googleEventId: googleEvent.id,
        meetLink: meetLink ?? null,
        attendees: attendees.map((a) => a.email),
        htmlLink: googleEvent.htmlLink ?? null,
      },
    })

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

    return NextResponse.json({
      ok: true,
      event: pulsoEvent,
      meetLink: meetLink ?? null,
      googleEventLink: googleEvent.htmlLink ?? null,
    })
  } catch (error) {
    console.error('POST /api/integrations/google-calendar/events error:', error)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
