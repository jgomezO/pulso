import { z } from 'zod'

export const EVENT_TYPES = [
  'note', 'email', 'call', 'meeting', 'ticket',
  'health_change', 'renewal', 'milestone',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const AccountEventSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  type: z.enum(EVENT_TYPES),
  source: z.enum(['manual', 'hubspot', 'intercom', 'segment'] as const).nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative'] as const).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdBy: z.string().uuid().nullable().optional(),
  occurredAt: z.string(),
  createdAt: z.string(),
})

export type AccountEvent = z.infer<typeof AccountEventSchema>

export const CreateAccountEventSchema = AccountEventSchema.omit({ id: true, createdAt: true })
export type CreateAccountEventInput = z.infer<typeof CreateAccountEventSchema>
