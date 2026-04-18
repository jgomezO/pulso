import { z } from 'zod'

export const ROLE_TYPES = ['champion', 'decision_maker', 'user', 'billing', 'technical', 'executive'] as const
export const INFLUENCE_LEVELS = ['low', 'medium', 'high'] as const
export const RELATIONSHIP_STATUSES = ['active', 'inactive', 'new', 'churned'] as const

export type RoleType         = typeof ROLE_TYPES[number]
export type InfluenceLevel   = typeof INFLUENCE_LEVELS[number]
export type RelationshipStatus = typeof RELATIONSHIP_STATUSES[number]

export const ContactSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  title: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  roleType: z.enum(ROLE_TYPES).default('user'),
  influenceLevel: z.enum(INFLUENCE_LEVELS).default('medium'),
  relationshipStatus: z.enum(RELATIONSHIP_STATUSES).default('active'),
  isChampion: z.boolean().default(false),
  isDecisionMaker: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  lastContactedAt: z.string().nullable().optional(),
  lastActivityAt: z.string().nullable().optional(),
  engagementScore: z.number().min(0).max(100).nullable().optional(),
  hubspotId: z.string().nullable().optional(),
  createdAt: z.string(),
})

export type Contact = z.infer<typeof ContactSchema>

export const CreateContactSchema = ContactSchema.omit({ id: true, createdAt: true })
export type CreateContactInput = z.infer<typeof CreateContactSchema>
