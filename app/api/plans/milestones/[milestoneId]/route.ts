import { NextRequest } from 'next/server'
import { z } from 'zod'
import { SuccessPlanRepositorySupabase } from '@/infrastructure/db/SuccessPlanRepositorySupabase'

const PatchMilestoneBody = z.object({
  title:       z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isCompleted: z.boolean().optional(),
  sortOrder:   z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  try {
    const { milestoneId } = await params
    const body   = await request.json()
    const parsed = PatchMilestoneBody.safeParse(body)

    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const repo      = new SuccessPlanRepositorySupabase()
    const milestone = await repo.updateMilestone(milestoneId, parsed.data)
    return Response.json({ milestone })
  } catch (err) {
    console.error('PATCH /api/plans/milestones/[milestoneId] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
