import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'

/** GET — Load a specific conversation */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from('copilot_conversations')
      .select('id, title, messages, is_active, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return Response.json({
      id: data.id as string,
      title: data.title as string,
      messages: data.messages as { role: string; content: string; timestamp: string }[],
      isActive: data.is_active as boolean,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    })
  } catch (error) {
    console.error('GET /api/ai/copilot/conversations/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
