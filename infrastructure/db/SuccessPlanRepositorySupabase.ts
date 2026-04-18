import { createServiceClient } from './supabase'
import type { SuccessPlan, PlanMilestone, CreatePlanInput, UpdatePlanInput } from '@/domain/plan/SuccessPlan'

function toPlan(row: Record<string, unknown>): SuccessPlan {
  return {
    id:           row.id as string,
    accountId:    row.account_id as string,
    title:        row.title as string,
    objective:    row.objective as string | null,
    templateType: row.template_type as SuccessPlan['templateType'],
    status:       (row.status as SuccessPlan['status']) ?? 'active',
    startDate:    row.start_date as string | null,
    targetDate:   row.target_date as string | null,
    progress:     (row.progress as number) ?? 0,
    createdBy:    row.created_by as string | null,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  }
}

function toMilestone(row: Record<string, unknown>): PlanMilestone {
  return {
    id:          row.id as string,
    planId:      row.plan_id as string,
    title:       row.title as string,
    description: row.description as string | null,
    sortOrder:   (row.sort_order as number) ?? 0,
    isCompleted: (row.is_completed as boolean) ?? false,
    completedAt: row.completed_at as string | null,
    createdAt:   row.created_at as string,
  }
}

export class SuccessPlanRepositorySupabase {
  private get db() { return createServiceClient() }

  async findByAccountId(accountId: string): Promise<SuccessPlan[]> {
    const { data, error } = await this.db
      .from('success_plans')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(toPlan)
  }

  async findById(planId: string): Promise<SuccessPlan | null> {
    const { data, error } = await this.db
      .from('success_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error || !data) return null
    return toPlan(data as Record<string, unknown>)
  }

  async findMilestonesByPlanId(planId: string): Promise<PlanMilestone[]> {
    const { data, error } = await this.db
      .from('plan_milestones')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data ?? []).map(toMilestone)
  }

  async create(input: CreatePlanInput): Promise<SuccessPlan> {
    const { data, error } = await this.db
      .from('success_plans')
      .insert({
        account_id:    input.accountId,
        title:         input.title,
        objective:     input.objective ?? null,
        template_type: input.templateType ?? 'custom',
        start_date:    input.startDate ?? null,
        target_date:   input.targetDate ?? null,
        created_by:    input.createdBy ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return toPlan(data as Record<string, unknown>)
  }

  async createMilestone(planId: string, title: string, description: string | null, sortOrder: number): Promise<PlanMilestone> {
    const { data, error } = await this.db
      .from('plan_milestones')
      .insert({ plan_id: planId, title, description, sort_order: sortOrder })
      .select()
      .single()

    if (error) throw error
    return toMilestone(data as Record<string, unknown>)
  }

  async update(planId: string, input: UpdatePlanInput): Promise<SuccessPlan> {
    const patch: Record<string, unknown> = {}
    if (input.title      !== undefined) patch.title       = input.title
    if (input.objective  !== undefined) patch.objective   = input.objective
    if (input.status     !== undefined) patch.status      = input.status
    if (input.startDate  !== undefined) patch.start_date  = input.startDate
    if (input.targetDate !== undefined) patch.target_date = input.targetDate
    if (input.progress   !== undefined) patch.progress    = input.progress

    const { data, error } = await this.db
      .from('success_plans')
      .update(patch)
      .eq('id', planId)
      .select()
      .single()

    if (error) throw error
    return toPlan(data as Record<string, unknown>)
  }

  async updateMilestone(milestoneId: string, patch: Partial<{ title: string; description: string | null; isCompleted: boolean; sortOrder: number }>): Promise<PlanMilestone> {
    const updates: Record<string, unknown> = {}
    if (patch.title       !== undefined) updates.title        = patch.title
    if (patch.description !== undefined) updates.description  = patch.description
    if (patch.sortOrder   !== undefined) updates.sort_order   = patch.sortOrder
    if (patch.isCompleted !== undefined) {
      updates.is_completed = patch.isCompleted
      updates.completed_at = patch.isCompleted ? new Date().toISOString() : null
    }

    const { data, error } = await this.db
      .from('plan_milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()
      .single()

    if (error) throw error
    return toMilestone(data as Record<string, unknown>)
  }

  /** Recalculate plan progress from task completion and auto-complete if 100% */
  async recalculateProgress(planId: string): Promise<void> {
    const { data: tasks, error } = await this.db
      .from('account_tasks')
      .select('status')
      .eq('plan_id', planId)

    if (error) return

    const total     = tasks?.length ?? 0
    const completed = (tasks ?? []).filter(t => t.status === 'completed' || t.status === 'cancelled').length
    const progress  = total === 0 ? 0 : Math.round((completed / total) * 100)

    const patch: Record<string, unknown> = { progress }

    if (progress === 100) {
      // Check if all milestones are also completed
      const { data: milestones } = await this.db
        .from('plan_milestones')
        .select('is_completed')
        .eq('plan_id', planId)

      const allMilestonesCompleted = (milestones ?? []).every(m => m.is_completed)
      if (allMilestonesCompleted) patch.status = 'completed'
    }

    await this.db.from('success_plans').update(patch).eq('id', planId)
  }
}
