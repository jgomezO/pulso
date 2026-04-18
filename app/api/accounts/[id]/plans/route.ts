import { NextRequest } from 'next/server'
import { z } from 'zod'
import { SuccessPlanRepositorySupabase } from '@/infrastructure/db/SuccessPlanRepositorySupabase'
import { TaskRepositorySupabase } from '@/infrastructure/db/TaskRepositorySupabase'
import { getTemplate } from '@/lib/plans/templates'
import { PLAN_TEMPLATE_TYPES } from '@/domain/plan/SuccessPlan'

const CreatePlanBody = z.object({
  title:        z.string().min(1),
  objective:    z.string().nullable().optional(),
  templateType: z.enum(PLAN_TEMPLATE_TYPES).optional(),
  startDate:    z.string().nullable().optional(),
  targetDate:   z.string().nullable().optional(),
  useTemplate:  z.boolean().default(false),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    const repo  = new SuccessPlanRepositorySupabase()
    const plans = await repo.findByAccountId(accountId)
    return Response.json({ plans })
  } catch (err) {
    console.error('GET /api/accounts/[id]/plans error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    const body   = await request.json()
    const parsed = CreatePlanBody.safeParse(body)

    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const planRepo  = new SuccessPlanRepositorySupabase()
    const taskRepo  = new TaskRepositorySupabase()
    const { title, objective, templateType, startDate, targetDate, useTemplate } = parsed.data

    // Resolve target date from template if not provided
    let resolvedTargetDate = targetDate ?? null
    if (!resolvedTargetDate && templateType && templateType !== 'custom') {
      const tmpl = getTemplate(templateType)
      if (tmpl && startDate) {
        const d = new Date(startDate)
        d.setDate(d.getDate() + tmpl.daysTarget)
        resolvedTargetDate = d.toISOString().split('T')[0]
      }
    }

    // Create plan
    const plan = await planRepo.create({
      accountId,
      title,
      objective: objective ?? (templateType && templateType !== 'custom' ? getTemplate(templateType)?.objective : null),
      templateType: templateType ?? 'custom',
      startDate: startDate ?? null,
      targetDate: resolvedTargetDate,
      useTemplate,
    })

    // If using a template, create milestones and tasks
    if (useTemplate && templateType && templateType !== 'custom') {
      const tmpl = getTemplate(templateType)
      if (tmpl) {
        for (let i = 0; i < tmpl.milestones.length; i++) {
          const ms   = tmpl.milestones[i]
          const milestone = await planRepo.createMilestone(plan.id, ms.title, null, i)

          for (const t of ms.tasks) {
            await taskRepo.create({
              accountId,
              title:       t.title,
              priority:    t.priority,
              planId:      plan.id,
              milestoneId: milestone.id,
            })
          }
        }
      }
    }

    return Response.json({ plan }, { status: 201 })
  } catch (err) {
    console.error('POST /api/accounts/[id]/plans error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
