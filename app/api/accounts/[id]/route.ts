import { NextRequest } from 'next/server'
import { z } from 'zod'
import { AccountRepositorySupabase } from '@/infrastructure/db/AccountRepositorySupabase'
import { ContactRepositorySupabase } from '@/infrastructure/db/ContactRepositorySupabase'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { GetAccountOverview } from '@/application/accounts/GetAccountOverview'
import { UpdateAccountSchema } from '@/domain/account/Account'

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

    const useCase = new GetAccountOverview(
      new AccountRepositorySupabase(),
      new ContactRepositorySupabase(),
      new EventRepositorySupabase()
    )

    const overview = await useCase.execute(id, query.data.orgId)
    if (!overview) {
      return Response.json({ error: 'Account not found' }, { status: 404 })
    }

    return Response.json(overview)
  } catch (error) {
    console.error('GET /api/accounts/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const PatchBodySchema = UpdateAccountSchema.extend({
  orgId: z.string().uuid(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = PatchBodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { orgId, ...input } = parsed.data
    const repo = new AccountRepositorySupabase()
    const account = await repo.update(id, orgId, input)

    return Response.json(account)
  } catch (error) {
    console.error('PATCH /api/accounts/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const repo = new AccountRepositorySupabase()
    await repo.delete(id, query.data.orgId)

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/accounts/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
