import { NextRequest } from 'next/server'
import { z } from 'zod'
import { SuccessPlanRepositorySupabase } from '@/infrastructure/db/SuccessPlanRepositorySupabase'

const CreateMilestoneBody = z.object({
  title:       z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder:   z.number().int().default(0),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const body   = await request.json()
    const parsed = CreateMilestoneBody.safeParse(body)

    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const repo      = new SuccessPlanRepositorySupabase()
    const milestone = await repo.createMilestone(planId, parsed.data.title, parsed.data.description ?? null, parsed.data.sortOrder)
    return Response.json({ milestone }, { status: 201 })
  } catch (err) {
    console.error('POST /api/plans/[planId]/milestones error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
