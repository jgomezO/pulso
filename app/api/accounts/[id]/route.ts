import { NextRequest } from 'next/server'
import { AccountRepositorySupabase } from '@/infrastructure/db/AccountRepositorySupabase'
import { ContactRepositorySupabase } from '@/infrastructure/db/ContactRepositorySupabase'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { GetAccountOverview } from '@/application/accounts/GetAccountOverview'
import { UpdateAccountSchema } from '@/domain/account/Account'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id } = await params

    const useCase = new GetAccountOverview(
      new AccountRepositorySupabase(),
      new ContactRepositorySupabase(),
      new EventRepositorySupabase()
    )

    const overview = await useCase.execute(id, auth.orgId)
    if (!overview) {
      return Response.json({ error: 'Account not found' }, { status: 404 })
    }

    return Response.json(overview)
  } catch (error) {
    console.error('GET /api/accounts/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id } = await params
    const body = await request.json()
    const parsed = UpdateAccountSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const repo = new AccountRepositorySupabase()
    const account = await repo.update(id, auth.orgId, parsed.data)

    return Response.json(account)
  } catch (error) {
    console.error('PATCH /api/accounts/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id } = await params
    const repo = new AccountRepositorySupabase()
    await repo.delete(id, auth.orgId)

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/accounts/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
