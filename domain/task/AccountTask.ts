import { z } from 'zod'

export const TASK_STATUSES   = ['pending', 'in_progress', 'completed', 'cancelled'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export type TaskStatus   = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const AccountTaskSchema = z.object({
  id:          z.string().uuid(),
  accountId:   z.string().uuid(),
  title:       z.string(),
  description: z.string().nullable().optional(),
  status:      z.enum(TASK_STATUSES),
  priority:    z.enum(TASK_PRIORITIES),
  dueDate:     z.string().nullable().optional(),
  assignedTo:  z.string().uuid().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  completedBy: z.string().uuid().nullable().optional(),
  source:      z.enum(['manual', 'playbook', 'ai_suggestion'] as const),
  createdBy:   z.string().uuid().nullable().optional(),
  planId:      z.string().uuid().nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  createdAt:   z.string(),
  updatedAt:   z.string(),
  accountName: z.string().optional(),
})

export type AccountTask = z.infer<typeof AccountTaskSchema>

export const CreateTaskSchema = z.object({
  accountId:   z.string().uuid(),
  title:       z.string().min(1).max(300),
  description: z.string().max(2000).nullable().optional(),
  priority:    z.enum(TASK_PRIORITIES).default('medium'),
  dueDate:     z.string().nullable().optional(),
  assignedTo:  z.string().uuid().nullable().optional(),
  planId:      z.string().uuid().nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
})
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>

export const UpdateTaskSchema = z.object({
  title:       z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  status:      z.enum(TASK_STATUSES).optional(),
  priority:    z.enum(TASK_PRIORITIES).optional(),
  dueDate:     z.string().nullable().optional(),
  assignedTo:  z.string().uuid().nullable().optional(),
})
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
