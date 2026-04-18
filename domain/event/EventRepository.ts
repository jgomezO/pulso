import type { AccountEvent, CreateAccountEventInput, EventType } from './AccountEvent'

export interface EventFilters {
  accountId: string
  types?: string[]
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

export interface EventRepository {
  findByAccountId(accountId: string, limit?: number, offset?: number): Promise<AccountEvent[]>
  findFiltered(filters: EventFilters): Promise<AccountEvent[]>
  countByType(accountId: string): Promise<Partial<Record<EventType, number>>>
  create(input: CreateAccountEventInput): Promise<AccountEvent>
  bulkCreate(inputs: CreateAccountEventInput[]): Promise<AccountEvent[]>
}
