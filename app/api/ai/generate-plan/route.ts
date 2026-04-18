import { NextResponse } from 'next/server'
import { z } from 'zod'
import { anthropic, AI_MODEL } from '@/infrastructure/ai/anthropic'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'
import {
  GENERATE_PLAN_SYSTEM_PROMPT,
  buildGeneratePlanUserMessage,
  type GeneratePlanContext,
} from '@/infrastructure/ai/prompts/generate-plan'

const RequestSchema = z.object({
  accountId: z.string().uuid(),
  templateType: z.enum(['onboarding', 'at_risk', 'renewal', 'expansion']),
  additionalContext: z.string().max(2000).optional(),
})

const AITaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  suggested_due_days: z.number(),
})

const AIMilestoneSchema = z.object({
  title: z.string(),
  sort_order: z.number(),
  tasks: z.array(AITaskSchema),
})

const AIResponseSchema = z.object({
  title: z.string(),
  objective: z.string(),
  reasoning: z.string(),
  milestones: z.array(AIMilestoneSchema),
})

export async function POST(request: Request) {
  // Auth
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Parse
  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { accountId, templateType, additionalContext } = parsed.data
  const serviceClient = createServiceClient()

  // Fetch context in parallel
  const [accountRes, contactsRes, eventsRes, plansRes] = await Promise.all([
    serviceClient
      .from('accounts')
      .select('name, domain, arr, tier, health_score, health_trend, risk_level, renewal_date, contract_start_date')
      .eq('id', accountId)
      .single(),
    serviceClient
      .from('contacts')
      .select('name, role, is_champion, is_decision_maker')
      .eq('account_id', accountId)
      .limit(10),
    serviceClient
      .from('account_events')
      .select('type, title, sentiment, occurred_at')
      .eq('account_id', accountId)
      .order('occurred_at', { ascending: false })
      .limit(15),
    serviceClient
      .from('success_plans')
      .select('title, status')
      .eq('account_id', accountId),
  ])

  if (!accountRes.data) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const a = accountRes.data

  const ctx: GeneratePlanContext = {
    account: {
      name: a.name,
      domain: a.domain,
      arr: a.arr,
      tier: a.tier,
      healthScore: a.health_score,
      healthTrend: a.health_trend,
      riskLevel: a.risk_level,
      renewalDate: a.renewal_date,
      contractStartDate: a.contract_start_date,
    },
    contacts: (contactsRes.data ?? []).map((c: Record<string, unknown>) => ({
      name: c.name as string,
      role: c.role as string | null,
      isChampion: c.is_champion as boolean,
      isDecisionMaker: c.is_decision_maker as boolean,
    })),
    recentEvents: (eventsRes.data ?? []).map((e: Record<string, unknown>) => ({
      type: e.type as string,
      title: e.title as string | null,
      sentiment: e.sentiment as string | null,
      occurredAt: e.occurred_at as string,
    })),
    existingPlans: (plansRes.data ?? []).map((p: Record<string, unknown>) => ({
      title: p.title as string,
      status: p.status as string,
    })),
    templateType,
    additionalContext: additionalContext ?? null,
  }

  const userMessage = buildGeneratePlanUserMessage(ctx)

  // Call Claude
  let responseText = ''
  let lastError = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: userMessage },
    ]
    if (attempt === 1) {
      messages.push(
        { role: 'assistant', content: responseText },
        { role: 'user', content: 'Tu respuesta anterior no fue JSON válido. Responde SOLO con JSON, sin backticks ni markdown. Sé conciso en descriptions.' },
      )
    }

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: GENERATE_PLAN_SYSTEM_PROMPT,
      messages,
    })

    const block = response.content[0]
    responseText = block.type === 'text' ? block.text : ''

    // Log if response was truncated
    if (response.stop_reason === 'max_tokens') {
      console.warn('generate-plan: response truncated by max_tokens')
    }

    // Try parse
    const cleaned = responseText.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim()
    try {
      const json = JSON.parse(cleaned)
      const validated = AIResponseSchema.safeParse(json)
      if (validated.success) {
        return NextResponse.json(validated.data)
      }
      lastError = `Zod validation: ${JSON.stringify(validated.error.flatten())}`
      console.warn('generate-plan: invalid schema', lastError)
    } catch (e) {
      lastError = `JSON parse: ${(e as Error).message}`
      console.warn('generate-plan: parse error', lastError)
    }
  }

  return NextResponse.json({ error: 'AI returned invalid response', detail: lastError }, { status: 502 })
}
