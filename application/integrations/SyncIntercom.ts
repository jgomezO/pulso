import type { EventRepository } from '@/domain/event/EventRepository'
import type { IntercomClient, MockIntercomClient } from '@/infrastructure/integrations/intercom/IntercomClient'
import { mapIntercomConversationToEvent } from '@/infrastructure/integrations/intercom/IntercomMapper'

type IntercomClientLike = Pick<IntercomClient, 'getConversations'> | MockIntercomClient

export class SyncIntercom {
  constructor(
    private readonly eventRepo: EventRepository,
    private readonly client: IntercomClientLike
  ) {}

  async execute(
    accountId: string,
    intercomCompanyId: string
  ): Promise<{ eventsCreated: number }> {
    const conversations = await this.client.getConversations(intercomCompanyId)

    const eventInputs = conversations.map((c) =>
      mapIntercomConversationToEvent(c, accountId)
    )

    if (eventInputs.length > 0) {
      await this.eventRepo.bulkCreate(eventInputs)
    }

    return { eventsCreated: eventInputs.length }
  }
}
