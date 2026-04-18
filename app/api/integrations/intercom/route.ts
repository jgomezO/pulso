import { NextRequest } from 'next/server'
import { z } from 'zod'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { IntercomClient, MockIntercomClient } from '@/infrastructure/integrations/intercom/IntercomClient'
import { SyncIntercom } from '@/application/integrations/SyncIntercom'

const BodySchema = z.object({
  accountId: z.string().uuid(),
  intercomCompanyId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { accountId, intercomCompanyId } = parsed.data
    const client = process.env.INTERCOM_ACCESS_TOKEN
      ? new IntercomClient()
      : new MockIntercomClient()

    const useCase = new SyncIntercom(new EventRepositorySupabase(), client)
    const result = await useCase.execute(accountId, intercomCompanyId)

    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('POST /api/integrations/intercom error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
