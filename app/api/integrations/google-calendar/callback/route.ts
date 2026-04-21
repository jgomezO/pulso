import { NextRequest, NextResponse } from 'next/server'
import { verifyState, exchangeCodeForTokens } from '@/infrastructure/integrations/google-calendar/GoogleCalendarOAuth'
import { createServiceClient } from '@/infrastructure/db/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=google_denied', request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=google_missing_params', request.url)
      )
    }

    // Verify state HMAC
    const stateData = verifyState(state)
    if (!stateData) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=google_invalid_state', request.url)
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Store tokens in integration_configs
    const supabase = createServiceClient()
    const { error: upsertError } = await supabase
      .from('integration_configs')
      .upsert(
        {
          org_id: stateData.orgId,
          type: 'google_calendar',
          credentials: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
            scope: tokens.scope,
          },
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,type' }
      )

    if (upsertError) {
      console.error('Failed to store Google Calendar tokens:', upsertError)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=google_storage_failed', request.url)
      )
    }

    return NextResponse.redirect(
      new URL('/settings/integrations?connected=google_calendar', request.url)
    )
  } catch (error) {
    console.error('GET /api/integrations/google-calendar/callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=google_unknown', request.url)
    )
  }
}
