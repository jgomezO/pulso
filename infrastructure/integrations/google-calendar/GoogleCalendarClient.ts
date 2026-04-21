import { refreshAccessToken } from './GoogleCalendarOAuth'

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

export interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  organizer?: { email: string; displayName?: string }
  status: string
  htmlLink?: string
}

interface CalendarEventsResponse {
  items: GoogleCalendarEvent[]
  nextPageToken?: string
}

export class GoogleCalendarClient {
  private accessToken: string
  private refreshToken: string

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  private async fetchWithRefresh(url: string, options?: RequestInit): Promise<Response> {
    const headers = { Authorization: `Bearer ${this.accessToken}`, ...options?.headers }
    let response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
      const tokens = await refreshAccessToken(this.refreshToken)
      this.accessToken = tokens.access_token
      headers.Authorization = `Bearer ${this.accessToken}`
      response = await fetch(url, { ...options, headers })
    }

    return response
  }

  getUpdatedAccessToken(): string {
    return this.accessToken
  }

  async createEvent(input: {
    summary: string
    description?: string
    startDateTime: string
    endDateTime: string
    attendees: Array<{ email: string; displayName?: string }>
    createMeetLink: boolean
  }): Promise<GoogleCalendarEvent & { hangoutLink?: string }> {
    const body: Record<string, unknown> = {
      summary: input.summary,
      description: input.description ?? '',
      start: { dateTime: input.startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: input.endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      attendees: input.attendees.map((a) => ({ email: a.email, displayName: a.displayName })),
    }

    if (input.createMeetLink) {
      body.conferenceData = {
        createRequest: {
          requestId: `pulso-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      }
    }

    const params = input.createMeetLink ? '?conferenceDataVersion=1' : ''
    const response = await this.fetchWithRefresh(
      `${CALENDAR_API_BASE}/calendars/primary/events${params}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Calendar create event error: ${error}`)
    }

    return response.json()
  }

  async deleteEvent(eventId: string): Promise<void> {
    const response = await this.fetchWithRefresh(
      `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
      { method: 'DELETE' }
    )

    // 204 = deleted, 410 = already deleted
    if (!response.ok && response.status !== 410) {
      const error = await response.text()
      throw new Error(`Google Calendar delete event error: ${error}`)
    }
  }

  async getEvents(daysBack: number = 30): Promise<GoogleCalendarEvent[]> {
    const timeMin = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
    const timeMax = new Date().toISOString()

    const allEvents: GoogleCalendarEvent[] = []
    let pageToken: string | undefined

    do {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      })
      if (pageToken) params.set('pageToken', pageToken)

      const response = await this.fetchWithRefresh(
        `${CALENDAR_API_BASE}/calendars/primary/events?${params.toString()}`
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Google Calendar API error: ${error}`)
      }

      const data: CalendarEventsResponse = await response.json()
      allEvents.push(...(data.items ?? []))
      pageToken = data.nextPageToken
    } while (pageToken)

    // Filter only confirmed events with attendees (actual meetings)
    return allEvents.filter(
      (event) => event.status === 'confirmed' && event.attendees && event.attendees.length > 0
    )
  }
}
