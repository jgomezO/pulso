import { anthropic, AI_MODEL } from '@/infrastructure/ai/anthropic'
import {
  type EmailComposerContext,
  type EmailImproveContext,
  EMAIL_COMPOSER_PROMPT,
  EMAIL_IMPROVE_PROMPT,
} from '@/infrastructure/ai/prompts/email-composer.prompt'

interface GeneratedEmail {
  subject: string
  body: string
}

function parseEmailResponse(raw: string): GeneratedEmail {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI did not return valid JSON')
  }

  const parsed = JSON.parse(jsonMatch[0]) as { subject?: string; body?: string }

  if (!parsed.subject || !parsed.body) {
    throw new Error('AI response missing subject or body')
  }

  return { subject: parsed.subject, body: parsed.body }
}

export async function generateEmail(
  ctx: EmailComposerContext
): Promise<GeneratedEmail> {
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: EMAIL_COMPOSER_PROMPT(ctx) }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return parseEmailResponse(textBlock?.text ?? '{}')
}

export async function improveEmail(
  ctx: EmailImproveContext
): Promise<GeneratedEmail> {
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: EMAIL_IMPROVE_PROMPT(ctx) }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return parseEmailResponse(textBlock?.text ?? '{}')
}
