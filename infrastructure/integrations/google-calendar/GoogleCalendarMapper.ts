import type { CreateAccountEventInput } from '@/domain/event/AccountEvent'
import type { GoogleCalendarEvent } from './GoogleCalendarClient'

export function mapGoogleCalendarEventToDomain(
  event: GoogleCalendarEvent,
  accountId: string
): CreateAccountEventInput {
  const occurredAt = event.start.dateTime ?? event.start.date ?? new Date().toISOString()

  return {
    accountId,
    type: 'meeting',
    source: 'google_calendar',
    title: event.summary ?? 'Meeting (no title)',
    description: event.description ?? null,
    metadata: {
      googleEventId: event.id,
      attendees: event.attendees?.map((a) => a.email) ?? [],
      htmlLink: event.htmlLink ?? null,
    },
    occurredAt,
  }
}

/**
 * Extract unique domains from event attendees (excluding the user's own domain)
 */
export function extractAttendeeDomains(
  event: GoogleCalendarEvent,
  excludeDomains: string[] = []
): string[] {
  const domains = new Set<string>()

  for (const attendee of event.attendees ?? []) {
    const domain = attendee.email.split('@')[1]
    if (domain && !excludeDomains.includes(domain)) {
      domains.add(domain)
    }
  }

  return Array.from(domains)
}
