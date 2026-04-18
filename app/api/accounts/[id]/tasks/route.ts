import { NextRequest } from 'next/server'
import { z } from 'zod'
import { TaskRepositorySupabase } from '@/infrastructure/db/TaskRepositorySupabase'
import { CreateTaskSchema, TASK_STATUSES } from '@/domain/task/AccountTask'

const GetQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const q = GetQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!q.success) return Response.json({ error: q.error.flatten() }, { status: 400 })

    const repo  = new TaskRepositorySupabase()
    const tasks = await repo.findByAccountId(id, q.data.status)
    return Response.json({ data: tasks })
  } catch (err) {
    console.error('GET /api/accounts/[id]/tasks error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body   = await request.json()
    const parsed = CreateTaskSchema.safeParse({ ...body, accountId: id })

    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const repo = new TaskRepositorySupabase()
    const task = await repo.create(parsed.data)
    return Response.json(task, { status: 201 })
  } catch (err) {
    console.error('POST /api/accounts/[id]/tasks error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
