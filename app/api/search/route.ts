import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

const QuerySchema = z.object({
  q: z.string().min(1).max(100),
})

interface SearchResults {
  accounts: { id: string; name: string; domain: string | null }[]
  contacts: { id: string; name: string; email: string | null; account_name: string }[]
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = QuerySchema.safeParse(params)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { q } = parsed.data
    const orgId = auth.orgId
    const db = createServiceClient()

    const [accountsRes, contactsRes] = await Promise.all([
      db
        .from('accounts')
        .select('id, name, domain')
        .eq('org_id', orgId)
        .is('archived_at', null)
        .or(`name.ilike.%${q}%,domain.ilike.%${q}%`)
        .limit(5),
      db
        .from('contacts')
        .select('id, name, email, accounts!inner(name, org_id)')
        .eq('accounts.org_id', orgId)
        .is('deleted_at', null)
        .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(5),
    ])

    if (accountsRes.error) throw accountsRes.error
    if (contactsRes.error) throw contactsRes.error

    const results: SearchResults = {
      accounts: (accountsRes.data ?? []).map(a => ({
        id: a.id as string,
        name: a.name as string,
        domain: a.domain as string | null,
      })),
      contacts: (contactsRes.data ?? []).map(c => {
        const row = c as Record<string, unknown>
        const acc = row.accounts as Record<string, unknown> | null
        return {
          id: row.id as string,
          name: row.name as string,
          email: row.email as string | null,
          account_name: (acc?.name as string) ?? '',
        }
      }),
    }

    return Response.json(results)
  } catch (error) {
    console.error('GET /api/search error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
