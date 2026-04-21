import type { SupabaseClient } from '@supabase/supabase-js'

interface AccountSummary {
  id: string
  name: string
  domain: string | null
  arr: number | null
  tier: string | null
  health_score: number | null
  health_trend: string | null
  risk_level: string | null
  renewal_date: string | null
  csm_notes: string | null
}

interface HealthHistoryEntry {
  account_id: string
  score: number
  signals: Record<string, number> | null
  calculated_at: string
}

interface TaskSummary {
  title: string
  status: string
  priority: string
  due_date: string | null
  account_name: string | null
}

interface RecentEvent {
  type: string
  title: string | null
  sentiment: string | null
  occurred_at: string
  account_name: string | null
}

function formatCurrency(v: number | null): string {
  if (v == null) return 'N/A'
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatDate(d: string | null): string {
  if (!d) return 'N/A'
  return d.slice(0, 10)
}

export async function buildPlatformContext(
  serviceClient: SupabaseClient,
  orgId: string
): Promise<string> {
  const [accountsRes, tasksRes, eventsRes] = await Promise.all([
    serviceClient
      .from('accounts')
      .select('id, name, domain, arr, tier, health_score, health_trend, risk_level, renewal_date, csm_notes')
      .eq('org_id', orgId)
      .is('archived_at', null)
      .order('arr', { ascending: false, nullsFirst: false })
      .limit(50),

    serviceClient
      .from('account_tasks')
      .select('title, status, priority, due_date, accounts(name)')
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(30),

    serviceClient
      .from('account_events')
      .select('type, title, sentiment, occurred_at, accounts(name)')
      .order('occurred_at', { ascending: false })
      .limit(20),
  ])

  const accounts = (accountsRes.data ?? []) as unknown as AccountSummary[]

  // Fetch latest health score history for accounts (with signal breakdown)
  const accountIds = accounts.map(a => a.id)
  const healthMap = new Map<string, HealthHistoryEntry>()

  if (accountIds.length > 0) {
    const { data: healthData } = await serviceClient
      .from('health_score_history')
      .select('account_id, score, signals, calculated_at')
      .in('account_id', accountIds)
      .order('calculated_at', { ascending: false })
      .limit(accountIds.length)

    if (healthData) {
      // Keep only the most recent entry per account
      for (const entry of healthData as HealthHistoryEntry[]) {
        if (!healthMap.has(entry.account_id)) {
          healthMap.set(entry.account_id, entry)
        }
      }
    }
  }
  const tasks = (tasksRes.data ?? []).map((t: Record<string, unknown>) => ({
    title: t.title as string,
    status: t.status as string,
    priority: t.priority as string,
    due_date: t.due_date as string | null,
    account_name: (t.accounts as { name: string } | null)?.name ?? null,
  })) as TaskSummary[]
  const events = (eventsRes.data ?? []).map((e: Record<string, unknown>) => ({
    type: e.type as string,
    title: e.title as string | null,
    sentiment: e.sentiment as string | null,
    occurred_at: e.occurred_at as string,
    account_name: (e.accounts as { name: string } | null)?.name ?? null,
  })) as RecentEvent[]

  const parts: string[] = []

  // --- KPIs ---
  const totalArr = accounts.reduce((sum, a) => sum + (a.arr ?? 0), 0)
  const atRisk = accounts.filter(a => a.risk_level === 'high' || a.risk_level === 'critical')
  const declining = accounts.filter(a => a.health_trend === 'declining')
  const avgHealth = accounts.filter(a => {
    const score = a.health_score ?? healthMap.get(a.id)?.score ?? null
    return score != null
  })
  const avgScore = avgHealth.length > 0
    ? Math.round(avgHealth.reduce((s, a) => s + (a.health_score ?? healthMap.get(a.id)?.score ?? 0), 0) / avgHealth.length)
    : null

  parts.push(`## KPIs del portafolio
- Total cuentas: ${accounts.length}
- ARR total: ${formatCurrency(totalArr)}
- Health score promedio: ${avgScore ?? 'N/A'}
- Cuentas en riesgo (high/critical): ${atRisk.length}
- Cuentas con tendencia declinante: ${declining.length}`)

  // --- Accounts table ---
  if (accounts.length > 0) {
    const rows = accounts.map(a => {
      const histEntry = healthMap.get(a.id)
      const score = a.health_score ?? histEntry?.score ?? null
      return `| ${a.id} | ${a.name} | ${a.tier ?? '-'} | ${formatCurrency(a.arr)} | ${score ?? '-'} | ${a.health_trend ?? '-'} | ${a.risk_level ?? '-'} | ${formatDate(a.renewal_date)} |`
    }).join('\n')

    parts.push(`## Cuentas (${accounts.length})
| ID | Cuenta | Tier | ARR | Score | Tendencia | Riesgo | Renovación |
|----|--------|------|-----|-------|-----------|--------|------------|
${rows}`)
  }

  // --- Health score breakdown ---
  const accountsWithHealth = accounts.filter(a => healthMap.has(a.id))
  if (accountsWithHealth.length > 0) {
    const healthLines = accountsWithHealth.map(a => {
      const h = healthMap.get(a.id)!
      const signals = h.signals
        ? Object.entries(h.signals).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'sin desglose'
      return `- **${a.name}** — Score: ${h.score} | ${signals}`
    }).join('\n')
    parts.push(`## Desglose de Health Score por señales
(product_usage, support_health, engagement, nps, payment_health, stakeholder_activity)
${healthLines}`)
  }

  // --- At-risk detail ---
  if (atRisk.length > 0) {
    const riskDetail = atRisk.map(a => {
      const notes = a.csm_notes ? ` — Notas: ${a.csm_notes.slice(0, 150)}` : ''
      return `- **${a.name}** (${a.risk_level}, score ${a.health_score ?? '?'}, ARR ${formatCurrency(a.arr)})${notes}`
    }).join('\n')
    parts.push(`## Cuentas en riesgo — detalle\n${riskDetail}`)
  }

  // --- Open tasks ---
  if (tasks.length > 0) {
    const taskLines = tasks.map(t =>
      `- [${t.priority}] ${t.title} — ${t.account_name ?? 'sin cuenta'} (${t.status}, vence ${formatDate(t.due_date)})`
    ).join('\n')
    parts.push(`## Tareas abiertas (${tasks.length})\n${taskLines}`)
  }

  // --- Recent events ---
  if (events.length > 0) {
    const eventLines = events.map(e =>
      `- ${formatDate(e.occurred_at)} | ${e.type} | ${e.account_name ?? '?'} | ${e.title ?? '-'} (${e.sentiment ?? 'neutral'})`
    ).join('\n')
    parts.push(`## Actividad reciente (últimos 20 eventos)\n${eventLines}`)
  }

  // --- Upcoming renewals ---
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = accounts
    .filter(a => a.renewal_date && a.renewal_date >= today)
    .sort((a, b) => (a.renewal_date ?? '').localeCompare(b.renewal_date ?? ''))
    .slice(0, 10)

  if (upcoming.length > 0) {
    const renewalLines = upcoming.map(a =>
      `- **${a.name}** — ${formatDate(a.renewal_date)} (score ${a.health_score ?? '?'}, ARR ${formatCurrency(a.arr)})`
    ).join('\n')
    parts.push(`## Próximas renovaciones\n${renewalLines}`)
  }

  return parts.join('\n\n')
}
