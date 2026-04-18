import { createServiceClient } from './supabase'
import type { EventRepository, EventFilters } from '@/domain/event/EventRepository'
import type { AccountEvent, CreateAccountEventInput, EventType } from '@/domain/event/AccountEvent'

function toEvent(row: Record<string, unknown>): AccountEvent {
  return {
    id:          row.id as string,
    accountId:   row.account_id as string,
    type:        row.type as AccountEvent['type'],
    source:      row.source as AccountEvent['source'],
    title:       row.title as string | null,
    description: row.description as string | null,
    sentiment:   row.sentiment as AccountEvent['sentiment'],
    metadata:    row.metadata as Record<string, unknown> | null,
    createdBy:   row.created_by as string | null,
    occurredAt:  row.occurred_at as string,
    createdAt:   row.created_at as string,
  }
}

export class EventRepositorySupabase implements EventRepository {
  private get db() { return createServiceClient() }

  async findByAccountId(accountId: string, limit = 20, offset = 0): Promise<AccountEvent[]> {
    const { data, error } = await this.db
      .from('account_events')
      .select('*')
      .eq('account_id', accountId)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return (data ?? []).map(toEvent)
  }

  async findFiltered(filters: EventFilters): Promise<AccountEvent[]> {
    let query = this.db
      .from('account_events')
      .select('*')
      .eq('account_id', filters.accountId)

    if (filters.types && filters.types.length > 0) {
      query = query.in('type', filters.types)
    }
    if (filters.fromDate) query = query.gte('occurred_at', filters.fromDate)
    if (filters.toDate)   query = query.lte('occurred_at', filters.toDate)

    const limit  = filters.limit  ?? 20
    const offset = filters.offset ?? 0
    const { data, error } = await query
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return (data ?? []).map(toEvent)
  }

  async countByType(accountId: string): Promise<Partial<Record<EventType, number>>> {
    const { data, error } = await this.db
      .from('account_events')
      .select('type')
      .eq('account_id', accountId)

    if (error) throw error
    const counts: Partial<Record<EventType, number>> = {}
    for (const row of data ?? []) {
      const t = row.type as EventType
      counts[t] = (counts[t] ?? 0) + 1
    }
    return counts
  }

  async create(input: CreateAccountEventInput): Promise<AccountEvent> {
    const { data, error } = await this.db
      .from('account_events')
      .insert({
        account_id:  input.accountId,
        type:        input.type,
        source:      input.source ?? 'manual',
        title:       input.title,
        description: input.description,
        sentiment:   input.sentiment,
        metadata:    input.metadata,
        created_by:  input.createdBy,
        occurred_at: input.occurredAt,
      })
      .select()
      .single()

    if (error) throw error
    return toEvent(data)
  }

  async bulkCreate(inputs: CreateAccountEventInput[]): Promise<AccountEvent[]> {
    const { data, error } = await this.db
      .from('account_events')
      .insert(inputs.map(input => ({
        account_id:  input.accountId,
        type:        input.type,
        source:      input.source ?? 'manual',
        title:       input.title,
        description: input.description,
        sentiment:   input.sentiment,
        metadata:    input.metadata,
        created_by:  input.createdBy,
        occurred_at: input.occurredAt,
      })))
      .select()

    if (error) throw error
    return (data ?? []).map(toEvent)
  }
}
