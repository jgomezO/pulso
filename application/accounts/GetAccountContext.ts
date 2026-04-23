import { createServiceClient } from '@/infrastructure/db/supabase'
import { DEFAULT_SIGNAL_CONFIG } from '@/lib/health-score/config'
import type { AccountContext } from '@/domain/account/AccountContext'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/** Build a condensed activity summary from raw events (no AI call). */
function buildActivitySummary(
  events: { type: string; sentiment: string | null; occurred_at: string }[],
  contacts: { is_champion: boolean; is_decision_maker: boolean; last_contacted_at: string | null }[]
): string {
  if (events.length === 0) return 'Sin actividad en los últimos 90 días.'

  const byType: Record<string, number> = {}
  let criticalTickets = 0
  const sentiments = { positive: 0, neutral: 0, negative: 0 }

  for (const e of events) {
    byType[e.type] = (byType[e.type] ?? 0) + 1
    if (e.type === 'ticket' && e.sentiment === 'negative') criticalTickets++
    if (e.sentiment && e.sentiment in sentiments) {
      sentiments[e.sentiment as keyof typeof sentiments]++
    }
  }

  const lines: string[] = [`Total eventos: ${events.length}`]

  if (byType['ticket']) lines.push(`Soporte: ${byType['ticket']} tickets${criticalTickets > 0 ? ` (${criticalTickets} críticos)` : ''}`)
  if (byType['meeting']) {
    const meetings = events.filter(e => e.type === 'meeting')
    const lastMeeting = meetings[0]
    const daysSince = lastMeeting
      ? Math.floor((Date.now() - new Date(lastMeeting.occurred_at).getTime()) / 86400000)
      : null
    lines.push(`Reuniones: ${byType['meeting']}${daysSince != null ? ` (última: hace ${daysSince} días)` : ''}`)
  }
  if (byType['email']) lines.push(`Emails: ${byType['email']}`)
  if (byType['call']) lines.push(`Llamadas: ${byType['call']}`)
  if (byType['note']) lines.push(`Notas del CSM: ${byType['note']}`)

  // Champion & decision maker last contact
  const champion = contacts.find(c => c.is_champion)
  if (champion?.last_contacted_at) {
    const days = Math.floor((Date.now() - new Date(champion.last_contacted_at).getTime()) / 86400000)
    lines.push(`Último contacto con champion: hace ${days} días`)
  }
  const dm = contacts.find(c => c.is_decision_maker)
  if (dm?.last_contacted_at) {
    const days = Math.floor((Date.now() - new Date(dm.last_contacted_at).getTime()) / 86400000)
    lines.push(`Último contacto con decision maker: hace ${days} días`)
  }

  // Sentiment overview
  const total = sentiments.positive + sentiments.neutral + sentiments.negative
  if (total > 0) {
    lines.push(`Sentimiento: ${sentiments.positive} positivos, ${sentiments.neutral} neutros, ${sentiments.negative} negativos`)
  }

  return lines.join('\n')
}

export async function getAccountContext(accountId: string): Promise<AccountContext> {
  const db = createServiceClient()
  const ninetyDaysAgo = daysAgo(90)

  const [
    accountRes,
    contactsRes,
    eventsRes,
    allEventsRes,
    signalsRes,
    tasksRes,
    plansRes,
    healthHistoryRes,
    cachedSummaryRes,
  ] = await Promise.all([
    db
      .from('accounts')
      .select('name, domain, arr, mrr, tier, renewal_date, health_score, health_trend, risk_level, industry')
      .eq('id', accountId)
      .single(),

    db
      .from('contacts')
      .select('name, email, role_type, is_champion, is_decision_maker, last_contacted_at')
      .eq('account_id', accountId)
      .order('is_champion', { ascending: false })
      .order('last_contacted_at', { ascending: false, nullsFirst: false })
      .limit(10),

    db
      .from('account_events')
      .select('type, title, description, sentiment, occurred_at')
      .eq('account_id', accountId)
      .order('occurred_at', { ascending: false })
      .limit(10),

    // All events in 90 days for activity summary
    db
      .from('account_events')
      .select('type, sentiment, occurred_at')
      .eq('account_id', accountId)
      .gte('occurred_at', ninetyDaysAgo)
      .order('occurred_at', { ascending: false }),

    db
      .from('account_signal_values')
      .select('signal_key, value')
      .eq('account_id', accountId),

    db
      .from('account_tasks')
      .select('title, priority, due_date')
      .eq('account_id', accountId)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),

    // Plans with milestones
    db
      .from('success_plans')
      .select('id, title, objective, progress')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),

    // Health score history — last 90 days
    db
      .from('health_score_history')
      .select('score, calculated_at')
      .eq('account_id', accountId)
      .gte('calculated_at', ninetyDaysAgo)
      .order('calculated_at', { ascending: true }),

    // Cached copilot context summary
    db
      .from('account_ai_summaries')
      .select('content, generated_at')
      .eq('account_id', accountId)
      .eq('type', 'copilot_context')
      .order('generated_at', { ascending: false })
      .limit(1),
  ])

  const account = accountRes.data
  if (!account) throw new Error('Account not found')

  // Signal values
  const signalValues = signalsRes.data ?? []
  const signals = DEFAULT_SIGNAL_CONFIG
    .filter(cfg => cfg.isActive)
    .map(cfg => {
      const sv = signalValues.find(s => (s.signal_key as string) === cfg.key)
      return {
        key: cfg.key,
        label: cfg.label,
        value: (sv?.value as number) ?? 0,
        weight: cfg.weight,
      }
    })

  // Health history — sample 1 per week (max ~13 points)
  const rawHistory = (healthHistoryRes.data ?? []) as { score: number; calculated_at: string }[]
  const healthHistory: { score: number; calculatedAt: string }[] = []
  let lastWeek = -1
  for (const h of rawHistory) {
    const d = new Date(h.calculated_at)
    const weekNum = Math.floor((Date.now() - d.getTime()) / (7 * 86400000))
    if (weekNum !== lastWeek) {
      healthHistory.push({ score: h.score, calculatedAt: h.calculated_at })
      lastWeek = weekNum
    }
  }

  // Fetch milestones for plans
  const planIds = (plansRes.data ?? []).map(p => p.id as string)
  let milestonesMap: Record<string, { title: string; is_completed: boolean; completed_at: string | null }[]> = {}
  if (planIds.length > 0) {
    const { data: milestones } = await db
      .from('plan_milestones')
      .select('plan_id, title, is_completed, completed_at')
      .in('plan_id', planIds)
      .order('sort_order', { ascending: true })

    for (const m of milestones ?? []) {
      const pid = m.plan_id as string
      if (!milestonesMap[pid]) milestonesMap[pid] = []
      milestonesMap[pid].push({
        title: m.title as string,
        is_completed: (m.is_completed as boolean) ?? false,
        completed_at: m.completed_at as string | null,
      })
    }
  }

  // Activity summary — use cached if < 24h, otherwise recompute
  const contactsData = contactsRes.data ?? []
  const cachedSummary = cachedSummaryRes.data?.[0]
  let activitySummary: string | null = null

  if (cachedSummary) {
    const age = Date.now() - new Date(cachedSummary.generated_at as string).getTime()
    if (age < 24 * 3600000) {
      activitySummary = cachedSummary.content as string
    }
  }

  if (!activitySummary) {
    const allEvents = (allEventsRes.data ?? []) as { type: string; sentiment: string | null; occurred_at: string }[]
    activitySummary = buildActivitySummary(allEvents, contactsData as { is_champion: boolean; is_decision_maker: boolean; last_contacted_at: string | null }[])

    // Cache the summary (fire and forget)
    void (async () => {
      try {
        await db.from('account_ai_summaries').insert({
          account_id: accountId,
          type: 'copilot_context',
          content: activitySummary,
          model: 'computed',
          tokens_used: 0,
        })
      } catch (err) {
        console.error('Failed to cache activity summary:', err)
      }
    })()
  }

  return {
    name: account.name as string,
    domain: account.domain as string | null,
    tier: account.tier as string | null,
    arr: account.arr as number | null,
    mrr: account.mrr as number | null,
    industry: account.industry as string | null,
    renewalDate: account.renewal_date as string | null,
    healthScore: account.health_score as number | null,
    healthTrend: account.health_trend as string | null,
    riskLevel: account.risk_level as string | null,
    contacts: contactsData.map(c => ({
      name: c.name as string,
      email: c.email as string | null,
      roleType: (c.role_type as string) || 'unknown',
      isChampion: (c.is_champion as boolean) ?? false,
      isDecisionMaker: (c.is_decision_maker as boolean) ?? false,
      lastContactedAt: c.last_contacted_at as string | null,
    })),
    signals,
    events: (eventsRes.data ?? []).map(e => ({
      type: e.type as string,
      title: e.title as string,
      description: e.description as string | null,
      sentiment: e.sentiment as string | null,
      occurredAt: e.occurred_at as string,
    })),
    tasks: (tasksRes.data ?? []).map(t => ({
      title: t.title as string,
      priority: t.priority as string,
      dueDate: t.due_date as string | null,
    })),
    plans: (plansRes.data ?? []).map(p => ({
      title: p.title as string,
      objective: p.objective as string | null,
      progress: (p.progress as number) ?? 0,
      milestones: (milestonesMap[p.id as string] ?? []).map(m => ({
        title: m.title,
        isCompleted: m.is_completed,
        completedAt: m.completed_at,
      })),
    })),
    healthHistory,
    activitySummary,
  }
}
