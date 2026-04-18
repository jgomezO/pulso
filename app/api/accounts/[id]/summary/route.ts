import { NextRequest } from 'next/server'
import { z } from 'zod'
import { AccountRepositorySupabase } from '@/infrastructure/db/AccountRepositorySupabase'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { GenerateAccountSummary } from '@/application/accounts/GenerateAccountSummary'

const QuerySchema = z.object({
  orgId: z.string().uuid(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const query = QuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    )

    if (!query.success) {
      return Response.json({ error: query.error.flatten() }, { status: 400 })
    }

    const useCase = new GenerateAccountSummary(
      new AccountRepositorySupabase(),
      new EventRepositorySupabase()
    )

    const stream = await useCase.execute(id, query.data.orgId)

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
