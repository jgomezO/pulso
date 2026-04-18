export const GENERATE_PLAN_SYSTEM_PROMPT = `Eres un experto en Customer Success para empresas SaaS B2B.
Generas Success Plans accionables y específicos para cada cuenta.

REGLAS:
- Genera 3-5 milestones con 2-4 tareas cada uno
- Las tareas DEBEN mencionar personas reales por nombre cuando hay contactos disponibles (ej: "Agendar QBR con María López, VP Engineering")
- Si hay un champion identificado, incluir acciones de fortalecimiento de esa relación en los primeros milestones
- Si hay un decision_maker, incluir al menos una tarea de engagement con esa persona
- Plazos relativos al hoy usando suggested_due_days (número de días desde hoy)
- Las primeras tareas deben ser ejecutables esta semana (suggested_due_days: 1-7)
- Si el health score es bajo (<40), priorizar diagnóstico antes de acciones correctivas
- Si hay renewal próxima (<90 días), incluir preparación de business review
- Si hay planes existentes activos, no repetir acciones que ya estén cubiertas
- Adaptar al tier: enterprise = estratégico, starter/growth = táctico y directo
- El reasoning debe explicar POR QUÉ elegiste estas acciones basándote en datos concretos de la cuenta

Responde SOLO con JSON válido. Sin markdown, sin backticks, sin texto adicional.

Formato exacto:
{
  "title": "string",
  "objective": "string",
  "reasoning": "string",
  "milestones": [
    {
      "title": "string",
      "sort_order": 0,
      "tasks": [
        {
          "title": "string",
          "description": "string",
          "priority": "high" | "medium" | "low",
          "suggested_due_days": 7
        }
      ]
    }
  ]
}`

interface AccountContext {
  name: string
  domain: string | null
  arr: number | null
  tier: string | null
  healthScore: number | null
  healthTrend: string | null
  riskLevel: string | null
  renewalDate: string | null
  contractStartDate: string | null
}

interface ContactContext {
  name: string
  role: string | null
  isChampion: boolean
  isDecisionMaker: boolean
}

interface EventContext {
  type: string
  title: string | null
  sentiment: string | null
  occurredAt: string
}

interface ExistingPlanContext {
  title: string
  status: string
}

export interface GeneratePlanContext {
  account: AccountContext
  contacts: ContactContext[]
  recentEvents: EventContext[]
  existingPlans: ExistingPlanContext[]
  templateType: string
  additionalContext: string | null
}

function formatCurrency(v: number | null): string {
  if (v == null) return 'N/A'
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function daysUntil(date: string | null): string {
  if (!date) return 'N/A'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date + 'T00:00:00')
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return `${diff} días`
}

export function buildGeneratePlanUserMessage(ctx: GeneratePlanContext): string {
  const parts: string[] = []

  parts.push(`CUENTA: ${ctx.account.name} | ARR: ${formatCurrency(ctx.account.arr)} | Tier: ${ctx.account.tier ?? 'N/A'}`)
  parts.push(`HEALTH SCORE: ${ctx.account.healthScore ?? 'N/A'}/100 | Tendencia: ${ctx.account.healthTrend ?? 'N/A'} | Riesgo: ${ctx.account.riskLevel ?? 'N/A'}`)
  parts.push(`RENOVACIÓN: ${ctx.account.renewalDate ?? 'N/A'} (${daysUntil(ctx.account.renewalDate)})`)

  if (ctx.contacts.length > 0) {
    parts.push('\nCONTACTOS CLAVE:')
    for (const c of ctx.contacts) {
      const tags: string[] = []
      if (c.isChampion) tags.push('⭐ Champion')
      if (c.isDecisionMaker) tags.push('🎯 Decision Maker')
      parts.push(`- ${c.name}, ${c.role ?? 'Sin rol'} ${tags.length > 0 ? tags.join(' ') : ''}`)
    }
  }

  if (ctx.recentEvents.length > 0) {
    parts.push('\nEVENTOS RECIENTES:')
    for (const e of ctx.recentEvents) {
      parts.push(`- [${e.occurredAt.slice(0, 10)}] ${e.type}: ${e.title ?? '-'} (${e.sentiment ?? 'neutral'})`)
    }
  }

  if (ctx.existingPlans.length > 0) {
    parts.push('\nPLANES EXISTENTES:')
    for (const p of ctx.existingPlans) {
      parts.push(`- ${p.title} (${p.status})`)
    }
  }

  const typeLabels: Record<string, string> = {
    onboarding: 'Onboarding',
    at_risk: 'En riesgo / Recuperación',
    renewal: 'Renovación',
    expansion: 'Expansión / Upsell',
  }
  parts.push(`\nTIPO DE PLAN SOLICITADO: ${typeLabels[ctx.templateType] ?? ctx.templateType}`)
  parts.push(`CONTEXTO ADICIONAL DEL CSM: ${ctx.additionalContext || 'Ninguno'}`)

  return parts.join('\n')
}
