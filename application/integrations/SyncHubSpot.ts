import type { ContactRepository } from '@/domain/contact/ContactRepository'
import type { EventRepository } from '@/domain/event/EventRepository'
import type { HubSpotClient, MockHubSpotClient } from '@/infrastructure/integrations/hubspot/HubSpotClient'
import {
  mapHubSpotContactToDomain,
  mapHubSpotEngagementToEvent,
} from '@/infrastructure/integrations/hubspot/HubSpotMapper'

type HubSpotClientLike = Pick<HubSpotClient, 'getContacts' | 'getEngagements'> | MockHubSpotClient

export class SyncHubSpot {
  constructor(
    private readonly contactRepo: ContactRepository,
    private readonly eventRepo: EventRepository,
    private readonly client: HubSpotClientLike
  ) {}

  async execute(
    accountId: string,
    hubspotCompanyId: string
  ): Promise<{ contactsUpserted: number; eventsCreated: number }> {
    const [rawContacts, rawEngagements] = await Promise.all([
      this.client.getContacts(hubspotCompanyId),
      this.client.getEngagements(hubspotCompanyId),
    ])

    // Upsert contacts
    const existingContacts = await this.contactRepo.findByAccountId(accountId)
    const existingHubspotIds = new Set(existingContacts.map((c) => c.hubspotId).filter(Boolean))

    const newContacts = rawContacts.filter((c) => !existingHubspotIds.has(c.id))
    await Promise.all(
      newContacts.map((c) =>
        this.contactRepo.create(mapHubSpotContactToDomain(c, accountId))
      )
    )

    // Bulk create events
    const eventInputs = rawEngagements.map((e) =>
      mapHubSpotEngagementToEvent(e, accountId)
    )
    if (eventInputs.length > 0) {
      await this.eventRepo.bulkCreate(eventInputs)
    }

    return {
      contactsUpserted: newContacts.length,
      eventsCreated: eventInputs.length,
    }
  }
}
