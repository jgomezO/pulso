import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ContactRepositorySupabase } from '@/infrastructure/db/ContactRepositorySupabase'

const CreateContactBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  title: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  roleType: z.enum(['champion', 'decision_maker', 'user', 'billing', 'technical', 'executive']).optional(),
  influenceLevel: z.enum(['low', 'medium', 'high']).optional(),
  relationshipStatus: z.enum(['active', 'inactive', 'new', 'churned']).optional(),
  isChampion: z.boolean().optional(),
  isDecisionMaker: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  engagementScore: z.number().min(0).max(100).nullable().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    const repo = new ContactRepositorySupabase()
    const contacts = await repo.findByAccountId(accountId)
    return Response.json(contacts)
  } catch (error) {
    console.error('GET /api/accounts/[id]/contacts error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    const body = await request.json()
    const parsed = CreateContactBodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const repo = new ContactRepositorySupabase()
    const contact = await repo.create({
      roleType: 'user',
      influenceLevel: 'medium',
      relationshipStatus: 'active',
      isChampion: false,
      isDecisionMaker: false,
      ...parsed.data,
      accountId,
    })

    return Response.json(contact, { status: 201 })
  } catch (error) {
    console.error('POST /api/accounts/[id]/contacts error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
