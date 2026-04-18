import { NextRequest } from 'next/server'
import { z } from 'zod'
import { TaskRepositorySupabase } from '@/infrastructure/db/TaskRepositorySupabase'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/domain/task/AccountTask'

const QuerySchema = z.object({
  userId:   z.string().uuid(),
  status:   z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(request: NextRequest) {
  try {
    const q = QuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!q.success) return Response.json({ error: q.error.flatten() }, { status: 400 })

    const repo  = new TaskRepositorySupabase()
    const tasks = await repo.findByAssignedTo(q.data.userId, {
      status:   q.data.status,
      priority: q.data.priority,
      page:     q.data.page,
      pageSize: q.data.pageSize,
    })
    return Response.json({ data: tasks })
  } catch (err) {
    console.error('GET /api/tasks error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
