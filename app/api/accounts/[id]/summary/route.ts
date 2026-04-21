import { NextRequest } from 'next/server'
import { AccountRepositorySupabase } from '@/infrastructure/db/AccountRepositorySupabase'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { GenerateAccountSummary } from '@/application/accounts/GenerateAccountSummary'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id } = await params

    const useCase = new GenerateAccountSummary(
      new AccountRepositorySupabase(),
      new EventRepositorySupabase()
    )

    const stream = await useCase.execute(id, auth.orgId)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('GET /api/accounts/[id]/summary error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
