import { createServiceClient } from './supabase'
import type { AccountRepository, AccountFilters } from '@/domain/account/AccountRepository'
import type { Account, CreateAccountInput, UpdateAccountInput } from '@/domain/account/Account'
import type { PaginationParams, PaginatedResult } from '@/domain/shared/types'

function toAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    domain: row.domain as string | null,
    arr: row.arr as number | null,
    mrr: row.mrr as number | null,
    tier: row.tier as Account['tier'],
    industry: row.industry as Account['industry'],
    renewalDate: row.renewal_date as string | null,
    contractStartDate: row.contract_start_date as string | null,
    healthScore: row.health_score as number | null,
    healthTrend: row.health_trend as Account['healthTrend'],
    riskLevel: row.risk_level as Account['riskLevel'],
    csmId: row.csm_id as string | null,
    csmNotes: row.csm_notes as string | null,
    archivedAt: row.archived_at as string | null,
    hubspotId: row.hubspot_id as string | null,
    intercomId: row.intercom_id as string | null,
    lastSyncedAt: row.last_synced_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export class AccountRepositorySupabase implements AccountRepository {
  private get db() {
    return createServiceClient()
  }

  async findById(id: string, orgId: string): Promise<Account | null> {
    const { data, error } = await this.db
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('archived_at', null)
      .single()

    if (error || !data) return null
    return toAccount(data)
  }

  async findAll(
    filters: AccountFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Account>> {
    let query = this.db
      .from('accounts')
      .select('*', { count: 'exact' })
      .eq('org_id', filters.orgId)
      .is('archived_at', null)

    if (filters.riskLevel) query = query.eq('risk_level', filters.riskLevel)
    if (filters.csmId) query = query.eq('csm_id', filters.csmId)
    if (filters.renewalBefore) query = query.lte('renewal_date', filters.renewalBefore)
    if (filters.search) query = query.ilike('name', `%${filters.search}%`)
    if (filters.tier) query = query.eq('tier', filters.tier)

    const from = (pagination.page - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1

    const { data, error, count } = await query
      .order('health_score', { ascending: true, nullsFirst: false })
      .range(from, to)

    if (error) throw error

    return {
      data: (data ?? []).map(toAccount),
      total: count ?? 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
  }

  async create(input: CreateAccountInput): Promise<Account> {
    const { data, error } = await this.db
      .from('accounts')
      .insert({
        org_id: input.orgId,
        name: input.name,
        domain: input.domain,
        arr: input.arr,
        mrr: input.mrr,
        tier: input.tier,
        industry: input.industry,
        renewal_date: input.renewalDate,
        contract_start_date: input.contractStartDate,
        csm_id: input.csmId,
        csm_notes: input.csmNotes,
      })
      .select()
      .single()

    if (error) throw error
    return toAccount(data)
  }

  async update(id: string, orgId: string, input: UpdateAccountInput): Promise<Account> {
    const updates: Record<string, unknown> = {}
    if (input.name !== undefined) updates.name = input.name
    if (input.domain !== undefined) updates.domain = input.domain
    if (input.arr !== undefined) updates.arr = input.arr
    if (input.mrr !== undefined) updates.mrr = input.mrr
    if (input.tier !== undefined) updates.tier = input.tier
    if (input.industry !== undefined) updates.industry = input.industry
    if (input.renewalDate !== undefined) updates.renewal_date = input.renewalDate
    if (input.contractStartDate !== undefined) updates.contract_start_date = input.contractStartDate
    if (input.csmId !== undefined) updates.csm_id = input.csmId
    if (input.csmNotes !== undefined) updates.csm_notes = input.csmNotes
    if (input.healthScore !== undefined) updates.health_score = input.healthScore
    if (input.healthTrend !== undefined) updates.health_trend = input.healthTrend
    if (input.riskLevel !== undefined) updates.risk_level = input.riskLevel
    updates.updated_at = new Date().toISOString()

    const { data, error } = await this.db
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return toAccount(data)
  }

  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await this.db
      .from('accounts')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  }

  async updateHealthScore(id: string, orgId: string, score: number, trend: string): Promise<void> {
    const { error } = await this.db
      .from('accounts')
      .update({ health_score: score, health_trend: trend })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  }
}
