import { createServiceClient } from './supabase'
import type { AccountTask, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '@/domain/task/AccountTask'

function toTask(row: Record<string, unknown>): AccountTask {
  const accountsRow = row.accounts as { name?: string } | null
  return {
    id:          row.id as string,
    accountId:   row.account_id as string,
    title:       row.title as string,
    description: row.description as string | null,
    status:      row.status as AccountTask['status'],
    priority:    row.priority as AccountTask['priority'],
    dueDate:     row.due_date as string | null,
    assignedTo:  row.assigned_to as string | null,
    completedAt: row.completed_at as string | null,
    completedBy: row.completed_by as string | null,
    source:      (row.source as AccountTask['source']) ?? 'manual',
    createdBy:   row.created_by as string | null,
    planId:      row.plan_id as string | null,
    milestoneId: row.milestone_id as string | null,
    createdAt:   row.created_at as string,
    updatedAt:   row.updated_at as string,
    accountName: accountsRow?.name,
  }
}

export class TaskRepositorySupabase {
  private get db() { return createServiceClient() }

  async findByAccountId(accountId: string, status?: TaskStatus): Promise<AccountTask[]> {
    let query = this.db
      .from('account_tasks')
      .select('*')
      .eq('account_id', accountId)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
      .order('due_date',   { ascending: true,  nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(toTask)
  }

  async findByAssignedTo(
    userId: string,
    filters: { status?: TaskStatus; priority?: TaskPriority; page?: number; pageSize?: number } = {}
  ): Promise<AccountTask[]> {
    const { page = 1, pageSize = 50 } = filters
    const offset = (page - 1) * pageSize

    let query = this.db
      .from('account_tasks')
      .select('*, accounts(name)')
      .eq('assigned_to', userId)

    if (filters.status)   query = query.eq('status',   filters.status)
    if (filters.priority) query = query.eq('priority', filters.priority)

    const { data, error } = await query
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error
    return (data ?? []).map(toTask)
  }

  async findById(id: string): Promise<AccountTask | null> {
    const { data, error } = await this.db
      .from('account_tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) { if (error.code === 'PGRST116') return null; throw error }
    return toTask(data as Record<string, unknown>)
  }

  async create(input: CreateTaskInput): Promise<AccountTask> {
    const { data, error } = await this.db
      .from('account_tasks')
      .insert({
        account_id:   input.accountId,
        title:        input.title,
        description:  input.description ?? null,
        priority:     input.priority ?? 'medium',
        due_date:     input.dueDate ?? null,
        assigned_to:  input.assignedTo ?? null,
        plan_id:      input.planId ?? null,
        milestone_id: input.milestoneId ?? null,
        source:       'manual',
      })
      .select()
      .single()

    if (error) throw error
    return toTask(data as Record<string, unknown>)
  }

  async update(
    id: string,
    input: UpdateTaskInput & { completedAt?: string | null; completedBy?: string | null }
  ): Promise<AccountTask> {
    const patch: Record<string, unknown> = {}
    if (input.title       !== undefined) patch.title        = input.title
    if (input.description !== undefined) patch.description  = input.description
    if (input.status      !== undefined) patch.status       = input.status
    if (input.priority    !== undefined) patch.priority     = input.priority
    if (input.dueDate     !== undefined) patch.due_date     = input.dueDate
    if (input.assignedTo  !== undefined) patch.assigned_to  = input.assignedTo
    if (input.completedAt !== undefined) patch.completed_at = input.completedAt
    if (input.completedBy !== undefined) patch.completed_by = input.completedBy

    const { data, error } = await this.db
      .from('account_tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toTask(data as Record<string, unknown>)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('account_tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
