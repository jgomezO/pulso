import { anthropic, AI_MODEL, AI_MAX_TOKENS } from './anthropic'
import { HEALTH_EXPLAIN_PROMPT, type HealthExplainContext } from './prompts/health-explain.prompt'

export async function streamHealthExplanation(
  context: HealthExplainContext
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  const stream = anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: HEALTH_EXPLAIN_PROMPT(context),
      },
    ],
  })

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })
}
