import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

const FeedbackSchema = z.object({
  conversationId: z.string().uuid(),
  messageIndex: z.number().int().min(0),
  rating: z.enum(['positive', 'negative']),
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = FeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('copilot_feedback')
      .upsert(
        {
          conversation_id: parsed.data.conversationId,
          message_index: parsed.data.messageIndex,
          rating: parsed.data.rating,
        },
        { onConflict: 'conversation_id,message_index' }
      )

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('POST /api/ai/copilot/feedback error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
