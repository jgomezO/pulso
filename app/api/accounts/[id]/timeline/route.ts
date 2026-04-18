import { NextRequest } from 'next/server'
import { z } from 'zod'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { GetAccountTimeline } from '@/application/accounts/GetAccountTimeline'

const QuerySchema = z.object({
  types: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const query = QuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))

    const useCase = new GetAccountTimeline(new EventRepositorySupabase())
    const events = await useCase.execute(id, {
      types: query.types?.split(','),
      fromDate: query.fromDate,
      toDate: query.toDate,
    })

    return Response.json({ events })
  } catch (error) {
    console.error('GET /api/accounts/[id]/timeline error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
