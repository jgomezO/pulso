import type { Account, CreateAccountInput, UpdateAccountInput } from './Account'
import type { PaginationParams, PaginatedResult } from '../shared/types'

export interface AccountFilters {
  orgId: string
  riskLevel?: string
  csmId?: string
  renewalBefore?: string // ISO date
  search?: string
  tier?: string
}

export interface AccountRepository {
  findById(id: string, orgId: string): Promise<Account | null>
  findAll(filters: AccountFilters, pagination: PaginationParams): Promise<PaginatedResult<Account>>
  create(input: CreateAccountInput): Promise<Account>
  update(id: string, orgId: string, input: UpdateAccountInput): Promise<Account>
  delete(id: string, orgId: string): Promise<void>
  updateHealthScore(id: string, orgId: string, score: number, trend: string): Promise<void>
}
