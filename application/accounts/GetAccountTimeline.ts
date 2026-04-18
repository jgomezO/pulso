import type { EventRepository, EventFilters } from '@/domain/event/EventRepository'
import type { AccountEvent } from '@/domain/event/AccountEvent'

export class GetAccountTimeline {
  constructor(private eventRepo: EventRepository) {}

  async execute(
    accountId: string,
    options?: { types?: string[]; fromDate?: string; toDate?: string }
  ): Promise<AccountEvent[]> {
    const filters: EventFilters = {
      accountId,
      types: options?.types,
      fromDate: options?.fromDate,
      toDate: options?.toDate,
    }

    return this.eventRepo.findFiltered(filters)
  }
}
