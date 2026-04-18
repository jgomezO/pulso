import { anthropic, AI_MODEL, AI_MAX_TOKENS } from './anthropic'
import { ACCOUNT_SUMMARY_PROMPT, type AccountSummaryContext } from './prompts/account-summary.prompt'

export async function generateAccountSummary(context: AccountSummaryContext): Promise<string> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: ACCOUNT_SUMMARY_PROMPT(context),
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from AI')
  return content.text
}

export async function streamAccountSummary(
  context: AccountSummaryContext
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  const stream = anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: ACCOUNT_SUMMARY_PROMPT(context),
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
