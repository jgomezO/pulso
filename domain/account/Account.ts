import { z } from 'zod'
import type { Tier, HealthTrend, RiskLevel } from '@/types'

export const AccountSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1),
  domain: z.string().nullable().optional(),
  arr: z.number().nullable().optional(),
  mrr: z.number().nullable().optional(),
  tier: z.enum(['enterprise', 'growth', 'starter', 'other']).nullable().optional(),
  industry: z.enum(['saas', 'fintech', 'ecommerce', 'healthtech', 'other']).nullable().optional(),
  renewalDate: z.string().nullable().optional(),
  contractStartDate: z.string().nullable().optional(),
  healthScore: z.number().min(0).max(100).nullable().optional(),
  healthTrend: z.enum(['improving', 'stable', 'declining']).nullable().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
  csmId: z.string().nullable().optional(),
  csmNotes: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  hubspotId: z.string().nullable().optional(),
  intercomId: z.string().nullable().optional(),
  lastSyncedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Account = z.infer<typeof AccountSchema>

export const CreateAccountSchema = AccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  healthScore: true,
  healthTrend: true,
  riskLevel: true,
  archivedAt: true,
  lastSyncedAt: true,
  hubspotId: true,
  intercomId: true,
})

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>

export const UpdateAccountSchema = CreateAccountSchema.partial().extend({
  healthScore: z.number().min(0).max(100).nullable().optional(),
  healthTrend: z.enum(['improving', 'stable', 'declining']).nullable().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
})
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>
