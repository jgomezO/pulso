import { NextRequest } from 'next/server'
import { TaskRepositorySupabase } from '@/infrastructure/db/TaskRepositorySupabase'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { SuccessPlanRepositorySupabase } from '@/infrastructure/db/SuccessPlanRepositorySupabase'
import { UpdateTaskSchema } from '@/domain/task/AccountTask'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const body       = await request.json()
    const parsed     = UpdateTaskSchema.safeParse(body)

    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const taskRepo = new TaskRepositorySupabase()
    const existing = await taskRepo.findById(taskId)
    if (!existing) return Response.json({ error: 'Task not found' }, { status: 404 })

    const isCompleting = parsed.data.status === 'completed' && existing.status !== 'completed'

    const updated = await taskRepo.update(taskId, {
      ...parsed.data,
      ...(isCompleting ? { completedAt: new Date().toISOString() } : {}),
    })

    if (isCompleting) {
      const eventRepo = new EventRepositorySupabase()
      await eventRepo.create({
        accountId:   existing.accountId,
        type:        'milestone',
        source:      'manual',
        title:       `Tarea completada: ${existing.title}`,
        description: null,
        sentiment:   'positive',
        metadata:    { taskId },
        occurredAt:  new Date().toISOString(),
      }).catch(() => {})
    }

    // Recalculate plan progress if this task belongs to a plan
    const planId = existing.planId ?? updated.planId
    if (planId && parsed.data.status !== undefined) {
      const planRepo = new SuccessPlanRepositorySupabase()
      await planRepo.recalculateProgress(planId).catch(() => {})
    }

    return Response.json(updated)
  } catch (err) {
    console.error('PATCH /api/tasks/[taskId] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const repo = new TaskRepositorySupabase()
    await repo.delete(taskId)
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/tasks/[taskId] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
