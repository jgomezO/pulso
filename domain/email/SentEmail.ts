import { z } from 'zod'

export const EMAIL_STATUSES = ['pending', 'sent', 'failed'] as const
export type EmailStatus = (typeof EMAIL_STATUSES)[number]

export const SentEmailSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  account_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  sent_by: z.string().uuid(),
  to_email: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  email_type: z.string().min(1),
  status: z.enum(EMAIL_STATUSES),
  resend_id: z.string().nullable(),
  error_message: z.string().nullable(),
  retry_count: z.number().int().default(0),
  sent_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type SentEmail = z.infer<typeof SentEmailSchema>

export const CreateSentEmailInputSchema = z.object({
  org_id: z.string().uuid(),
  account_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  sent_by: z.string().uuid(),
  to_email: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  email_type: z.string().min(1),
})

export type CreateSentEmailInput = z.infer<typeof CreateSentEmailInputSchema>
