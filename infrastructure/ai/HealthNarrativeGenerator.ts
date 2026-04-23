import { anthropic, AI_MODEL } from '@/infrastructure/ai/anthropic'
import {
  type HealthNarrativeContext,
  HEALTH_NARRATIVE_PROMPT,
  NO_SIGNALS_MESSAGE,
} from '@/infrastructure/ai/prompts/health-narrative.prompt'

export async function generateHealthNarrative(
  ctx: HealthNarrativeContext
): Promise<{ content: string; tokensUsed: number }> {
  if (!ctx.signalsConfigured) {
    return { content: NO_SIGNALS_MESSAGE, tokensUsed: 0 }
  }

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: HEALTH_NARRATIVE_PROMPT(ctx),
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const content = textBlock?.text ?? ''
  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

  return { content, tokensUsed }
}
