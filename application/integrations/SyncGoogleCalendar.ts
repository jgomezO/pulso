import type { EventRepository } from '@/domain/event/EventRepository'
import type { GoogleCalendarClient } from '@/infrastructure/integrations/google-calendar/GoogleCalendarClient'
import {
  mapGoogleCalendarEventToDomain,
  extractAttendeeDomains,
} from '@/infrastructure/integrations/google-calendar/GoogleCalendarMapper'

interface AccountWithDomain {
  id: string
  domain: string | null
}

interface AccountRepository {
  findByOrgId(orgId: string): Promise<AccountWithDomain[]>
}

export class SyncGoogleCalendar {
  constructor(
    private readonly eventRepo: EventRepository,
    private readonly accountRepo: AccountRepository,
    private readonly calendarClient: GoogleCalendarClient
  ) {}

  async execute(
    orgId: string,
    userDomain?: string
  ): Promise<{ eventsCreated: number; eventsSkipped: number }> {
    // Fetch accounts to build domain → accountId map
    const accounts = await this.accountRepo.findByOrgId(orgId)
    const domainToAccountId = new Map<string, string>()
    for (const account of accounts) {
      if (account.domain) {
        domainToAccountId.set(account.domain.toLowerCase(), account.id)
      }
    }

    // Domains to exclude from matching (org's own domain)
    const excludeDomains = userDomain ? [userDomain] : []

    // Fetch calendar events
    const events = await this.calendarClient.getEvents(30)

    let eventsCreated = 0
    let eventsSkipped = 0

    for (const event of events) {
      // Check for deduplication by googleEventId
      const existingEvents = await this.eventRepo.findFiltered({
        accountId: '', // We'll check per-account below
        types: ['meeting'],
      })

      // Match event to accounts by attendee domain
      const attendeeDomains = extractAttendeeDomains(event, excludeDomains)
      const matchedAccountIds = new Set<string>()

      for (const domain of attendeeDomains) {
        const accountId = domainToAccountId.get(domain.toLowerCase())
        if (accountId) matchedAccountIds.add(accountId)
      }

      if (matchedAccountIds.size === 0) {
        eventsSkipped++
        continue
      }

      // Create event for each matched account (deduplicate by googleEventId)
      for (const accountId of matchedAccountIds) {
        const accountEvents = await this.eventRepo.findFiltered({
          accountId,
          types: ['meeting'],
        })

        const isDuplicate = accountEvents.some(
          (e) => e.metadata && (e.metadata as Record<string, unknown>)['googleEventId'] === event.id
        )

        if (isDuplicate) {
          eventsSkipped++
          continue
        }

        const eventInput = mapGoogleCalendarEventToDomain(event, accountId)
        await this.eventRepo.create(eventInput)
        eventsCreated++
      }
    }

    return { eventsCreated, eventsSkipped }
  }
}
