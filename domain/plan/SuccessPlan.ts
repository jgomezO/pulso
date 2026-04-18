import { z } from 'zod'

export const PLAN_STATUSES       = ['active', 'completed', 'paused', 'cancelled'] as const
export const PLAN_TEMPLATE_TYPES = ['onboarding', 'at_risk', 'renewal', 'expansion', 'custom'] as const

export type PlanStatus       = typeof PLAN_STATUSES[number]
export type PlanTemplateType = typeof PLAN_TEMPLATE_TYPES[number]

export const SuccessPlanSchema = z.object({
  id:           z.string().uuid(),
  accountId:    z.string().uuid(),
  title:        z.string(),
  objective:    z.string().nullable().optional(),
  templateType: z.enum(PLAN_TEMPLATE_TYPES).nullable().optional(),
  status:       z.enum(PLAN_STATUSES).default('active'),
  startDate:    z.string().nullable().optional(),
  targetDate:   z.string().nullable().optional(),
  progress:     z.number().min(0).max(100).default(0),
  createdBy:    z.string().uuid().nullable().optional(),
  createdAt:    z.string(),
  updatedAt:    z.string(),
})
export type SuccessPlan = z.infer<typeof SuccessPlanSchema>

export const PlanMilestoneSchema = z.object({
  id:          z.string().uuid(),
  planId:      z.string().uuid(),
  title:       z.string(),
  description: z.string().nullable().optional(),
  sortOrder:   z.number().default(0),
  isCompleted: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  createdAt:   z.string(),
})
export type PlanMilestone = z.infer<typeof PlanMilestoneSchema>

export const CreatePlanSchema = z.object({
  accountId:    z.string().uuid(),
  title:        z.string().min(1),
  objective:    z.string().nullable().optional(),
  templateType: z.enum(PLAN_TEMPLATE_TYPES).optional(),
  startDate:    z.string().nullable().optional(),
  targetDate:   z.string().nullable().optional(),
  createdBy:    z.string().uuid().nullable().optional(),
  useTemplate:  z.boolean().default(false),
})
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>

export const UpdatePlanSchema = z.object({
  title:      z.string().min(1).optional(),
  objective:  z.string().nullable().optional(),
  status:     z.enum(PLAN_STATUSES).optional(),
  startDate:  z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  progress:   z.number().min(0).max(100).optional(),
})
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>
