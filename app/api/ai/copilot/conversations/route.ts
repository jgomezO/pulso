import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

const QuerySchema = z.object({
  accountId: z.string().uuid(),
})

/** GET — List conversations for an account */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = QuerySchema.safeParse({ accountId: searchParams.get('accountId') })

    if (!parsed.success) {
      return Response.json({ error: 'accountId is required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from('copilot_conversations')
      .select('id, title, is_active, created_at, updated_at, messages')
      .eq('account_id', parsed.data.accountId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10)

    if (error) throw error

    // Return conversations with preview (first user message)
    const conversations = (data ?? []).map(c => {
      const msgs = c.messages as { role: string; content: string }[]
      const firstUser = msgs.find(m => m.role === 'user')
      return {
        id: c.id as string,
        title: c.title as string,
        isActive: c.is_active as boolean,
        preview: firstUser ? (firstUser.content.slice(0, 80) + (firstUser.content.length > 80 ? '...' : '')) : '',
        messageCount: msgs.length,
        createdAt: c.created_at as string,
        updatedAt: c.updated_at as string,
      }
    })

    return Response.json({ conversations })
  } catch (error) {
    console.error('GET /api/ai/copilot/conversations error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST — Create new conversation (archive the current active one) */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = z.object({ accountId: z.string().uuid() }).safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'accountId is required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Archive current active conversation
    await serviceClient
      .from('copilot_conversations')
      .update({ is_active: false })
      .eq('account_id', parsed.data.accountId)
      .eq('user_id', user.id)
      .eq('is_active', true)

    return Response.json({ success: true })
  } catch (error) {
    console.error('POST /api/ai/copilot/conversations error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
