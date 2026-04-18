import { z } from 'zod'

export const HealthSignalsSchema = z.object({
  productUsageScore: z.number().min(0).max(100),
  supportHealthScore: z.number().min(0).max(100),
  engagementScore: z.number().min(0).max(100),
  npsScore: z.number().min(0).max(100).nullable(),
  paymentScore: z.number().min(0).max(100),
  stakeholderScore: z.number().min(0).max(100),
})

export type HealthSignals = z.infer<typeof HealthSignalsSchema>

export const HealthScoreRecordSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  score: z.number().min(0).max(100),
  signals: HealthSignalsSchema.nullable().optional(),
  aiExplanation: z.string().nullable().optional(),
  calculatedAt: z.string(),
})

export type HealthScoreRecord = z.infer<typeof HealthScoreRecordSchema>
