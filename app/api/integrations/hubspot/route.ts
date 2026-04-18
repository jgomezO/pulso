import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ContactRepositorySupabase } from '@/infrastructure/db/ContactRepositorySupabase'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { HubSpotClient, MockHubSpotClient } from '@/infrastructure/integrations/hubspot/HubSpotClient'
import { SyncHubSpot } from '@/application/integrations/SyncHubSpot'

const BodySchema = z.object({
  accountId: z.string().uuid(),
  hubspotCompanyId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { accountId, hubspotCompanyId } = parsed.data
    const client = process.env.HUBSPOT_ACCESS_TOKEN
      ? new HubSpotClient()
      : new MockHubSpotClient()

    const useCase = new SyncHubSpot(
      new ContactRepositorySupabase(),
      new EventRepositorySupabase(),
      client
    )

    const result = await useCase.execute(accountId, hubspotCompanyId)

    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('POST /api/integrations/hubspot error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
