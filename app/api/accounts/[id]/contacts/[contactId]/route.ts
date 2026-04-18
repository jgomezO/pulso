import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ContactRepositorySupabase } from '@/infrastructure/db/ContactRepositorySupabase'

const PatchContactBodySchema = z.object({
  name: z.string().min(1).optional(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params
    const body = await request.json()
    const parsed = PatchContactBodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const repo = new ContactRepositorySupabase()
    const contact = await repo.update(contactId, parsed.data)

    return Response.json(contact)
  } catch (error) {
    console.error('PATCH /api/accounts/[id]/contacts/[contactId] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params
    const repo = new ContactRepositorySupabase()
    await repo.delete(contactId)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/accounts/[id]/contacts/[contactId] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
