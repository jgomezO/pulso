import { NextRequest } from 'next/server'
import { z } from 'zod'
import { AccountRepositorySupabase } from '@/infrastructure/db/AccountRepositorySupabase'
import { CreateAccountSchema } from '@/domain/account/Account'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  riskLevel: z.string().optional(),
  csmId: z.string().optional(),
  renewalBefore: z.string().optional(),
  search: z.string().optional(),
  tier: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const query = QuerySchema.safeParse(params)

    if (!query.success) {
      return Response.json({ error: query.error.flatten() }, { status: 400 })
    }

    const { page, pageSize, riskLevel, csmId, renewalBefore, search, tier } = query.data

    const repo = new AccountRepositorySupabase()
    const result = await repo.findAll(
      { orgId: auth.orgId, riskLevel, csmId, renewalBefore, search, tier },
      { page, pageSize }
    )

    return Response.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('GET /api/accounts error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const body = await request.json()
    const ClientCreateSchema = CreateAccountSchema.omit({ orgId: true })
    const parsed = ClientCreateSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const repo = new AccountRepositorySupabase()
    const account = await repo.create({ ...parsed.data, orgId: auth.orgId })

    return Response.json(account, { status: 201 })
  } catch (error) {
    console.error('POST /api/accounts error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
