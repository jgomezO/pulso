import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/infrastructure/db/supabase'

const ImportRowSchema = z.object({
  name:        z.string().min(1),
  domain:      z.string().nullable().optional(),
  tier:        z.enum(['enterprise', 'growth', 'starter', 'other']).nullable().optional(),
  arr:         z.number().nullable().optional(),
  renewalDate: z.string().nullable().optional(),
  industry:    z.enum(['saas', 'fintech', 'ecommerce', 'healthtech', 'other']).nullable().optional(),
  csmEmail:    z.string().email().nullable().optional(),
})

const ImportBodySchema = z.object({
  orgId:          z.string().uuid(),
  rows:           z.array(ImportRowSchema).min(1).max(500),
  updateExisting: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json()
    const parsed = ImportBodySchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { orgId, rows, updateExisting } = parsed.data
    const db = createServiceClient()

    // ── Resolve CSM emails → user IDs ──────────────────────────────────────
    const emailsNeeded = [...new Set(rows.map(r => r.csmEmail).filter(Boolean) as string[])]
    const emailToId: Record<string, string> = {}

    if (emailsNeeded.length > 0) {
      const { data: usersData } = await db.auth.admin.listUsers()
      for (const u of usersData?.users ?? []) {
        if (u.email && emailsNeeded.includes(u.email)) {
          emailToId[u.email] = u.id
        }
      }
    }

    // ── Find existing accounts by domain for upsert ────────────────────────
    const domainsInBatch = rows.map(r => r.domain).filter(Boolean) as string[]
    const existingByDomain: Record<string, string> = {} // domain → account id

    if (domainsInBatch.length > 0) {
      const { data: existing } = await db
        .from('accounts')
        .select('id, domain')
        .eq('org_id', orgId)
        .in('domain', domainsInBatch)

      for (const acc of existing ?? []) {
        if (acc.domain) existingByDomain[acc.domain] = acc.id
      }
    }

    // ── Process each row ──────────────────────────────────────────────────
    let imported = 0
    let updated  = 0
    const errors: { row: number; name: string; message: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i]
      const csmId  = row.csmEmail ? (emailToId[row.csmEmail] ?? null) : null
      const record = {
        org_id:       orgId,
        name:         row.name,
        domain:       row.domain   ?? null,
        tier:         row.tier     ?? null,
        arr:          row.arr      ?? null,
        renewal_date: row.renewalDate ?? null,
        industry:     row.industry ?? null,
        csm_id:       csmId,
      }

      const existingId = row.domain ? existingByDomain[row.domain] : undefined

      if (existingId && updateExisting) {
        // Update existing account
        const { error } = await db
          .from('accounts')
          .update(record)
          .eq('id', existingId)

        if (error) {
          errors.push({ row: i + 1, name: row.name, message: error.message })
        } else {
          updated++
        }
      } else if (!existingId) {
        // Insert new account
        const { error } = await db
          .from('accounts')
          .insert(record)

        if (error) {
          errors.push({ row: i + 1, name: row.name, message: error.message })
        } else {
          imported++
        }
      }
      // else: duplicate and updateExisting=false → skip silently
    }

    return Response.json({ imported, updated, errors })
  } catch (err) {
    console.error('POST /api/accounts/import error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
