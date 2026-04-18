import { NextRequest } from 'next/server'
import { SuccessPlanRepositorySupabase } from '@/infrastructure/db/SuccessPlanRepositorySupabase'
import { UpdatePlanSchema } from '@/domain/plan/SuccessPlan'
import { createServiceClient } from '@/infrastructure/db/supabase'



export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const planRepo  = new SuccessPlanRepositorySupabase()

    const [plan, milestones] = await Promise.all([
      planRepo.findById(planId),
      planRepo.findMilestonesByPlanId(planId),
    ])

    if (!plan) return Response.json({ error: 'Plan not found' }, { status: 404 })

    // Fetch all tasks for this plan
    const { data: taskRows } = await createServiceClient()
      .from('account_tasks')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })

    const tasks = (taskRows ?? []).map((row: Record<string, unknown>) => ({
      id:          row.id as string,
      accountId:   row.account_id as string,
      title:       row.title as string,
      description: row.description as string | null,
      status:      row.status as string,
      priority:    row.priority as string,
      dueDate:     row.due_date as string | null,
      assignedTo:  row.assigned_to as string | null,
      completedAt: row.completed_at as string | null,
      planId:      row.plan_id as string | null,
      milestoneId: row.milestone_id as string | null,
      source:      (row.source as string) ?? 'manual',
      createdBy:   row.created_by as string | null,
      createdAt:   row.created_at as string,
      updatedAt:   row.updated_at as string,
    }))

    const milestonesWithTasks = milestones.map(ms => ({
      ...ms,
      tasks: tasks.filter(t => t.milestoneId === ms.id),
    }))

    return Response.json({ plan, milestones: milestonesWithTasks, unassignedTasks: tasks.filter(t => !t.milestoneId) })
  } catch (err) {
    console.error('GET /api/plans/[planId] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const body   = await request.json()
    const parsed = UpdatePlanSchema.safeParse(body)

    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const repo    = new SuccessPlanRepositorySupabase()
    const updated = await repo.update(planId, parsed.data)
    return Response.json({ plan: updated })
  } catch (err) {
    console.error('PATCH /api/plans/[planId] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const repo = new SuccessPlanRepositorySupabase()
    await repo.delete(planId)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/plans/[planId] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
