import { z } from 'zod'
import { anthropic, AI_MODEL } from '@/infrastructure/ai/anthropic'
import { buildCopilotSystemPrompt } from '@/infrastructure/ai/prompts/copilot.prompt'
import { getAccountContext } from '@/application/accounts/GetAccountContext'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

const CopilotRequestSchema = z.object({
  accountId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).max(50),
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CopilotRequestSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { accountId, message, conversationId, conversationHistory } = parsed.data

    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return Response.json({ error: 'No organization found' }, { status: 403 })
    }

    const { data: accountCheck } = await serviceClient
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .eq('org_id', profile.org_id)
      .single()

    if (!accountCheck) {
      return Response.json({ error: 'Account not found or access denied' }, { status: 403 })
    }

    // Gather account context
    const accountContext = await getAccountContext(accountId)
    const systemPrompt = buildCopilotSystemPrompt(accountContext)

    // Stream response from Claude
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...conversationHistory.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              fullResponse += chunk.delta.text
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
          controller.close()

          // Save conversation after streaming completes
          const now = new Date().toISOString()
          const newMessages = [
            ...conversationHistory.map(m => ({ ...m, timestamp: now })),
            { role: 'user', content: message, timestamp: now },
            { role: 'assistant', content: fullResponse, timestamp: now },
          ]

          if (conversationId) {
            // Update existing conversation
            await serviceClient
              .from('copilot_conversations')
              .update({
                messages: newMessages,
                updated_at: now,
              })
              .eq('id', conversationId)
          } else {
            // Create new conversation
            const title = message.slice(0, 50) + (message.length > 50 ? '...' : '')
            await serviceClient
              .from('copilot_conversations')
              .insert({
                account_id: accountId,
                user_id: user.id,
                org_id: profile.org_id,
                messages: newMessages,
                title,
                is_active: true,
              })
          }
        } catch (err) {
          console.error('Copilot stream error:', err)
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('POST /api/ai/copilot error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
