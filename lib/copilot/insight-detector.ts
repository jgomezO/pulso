import type { AccountContext } from '@/domain/account/AccountContext'

export interface DetectedInsight {
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  data: Record<string, unknown>
}

/** Detect proactive insights from account context data. */
export function detectInsights(ctx: AccountContext): DetectedInsight[] {
  const insights: DetectedInsight[] = []
  const now = Date.now()

  // 1. Health score drop — compare latest vs 2 weeks ago
  if (ctx.healthHistory.length >= 2) {
    const latest = ctx.healthHistory[ctx.healthHistory.length - 1]
    const twoWeeksAgo = ctx.healthHistory.find(h => {
      const age = now - new Date(h.calculatedAt).getTime()
      return age >= 12 * 86400000 // ~12 days
    })
    if (twoWeeksAgo && latest.score < twoWeeksAgo.score - 10) {
      const drop = twoWeeksAgo.score - latest.score
      insights.push({
        type: 'health_drop',
        severity: drop >= 20 ? 'critical' : 'warning',
        title: `Health score cayó ${drop} puntos`,
        description: `El health score bajó de ${twoWeeksAgo.score} a ${latest.score} en las últimas 2 semanas. Revisa las señales para identificar la causa.`,
        data: { from: twoWeeksAgo.score, to: latest.score, drop },
      })
    }
  }

  // 2. Champion inactive — no contact in 30+ days
  for (const contact of ctx.contacts) {
    if (!contact.isChampion) continue
    if (!contact.lastContactedAt) {
      insights.push({
        type: 'champion_inactive',
        severity: 'warning',
        title: `Champion sin contacto: ${contact.name}`,
        description: `No hay registro de contacto con ${contact.name} (champion). Agenda una reunión o envía un check-in.`,
        data: { contactName: contact.name },
      })
      continue
    }
    const daysSince = Math.floor((now - new Date(contact.lastContactedAt).getTime()) / 86400000)
    if (daysSince >= 30) {
      insights.push({
        type: 'champion_inactive',
        severity: daysSince >= 60 ? 'critical' : 'warning',
        title: `Champion sin contacto: ${contact.name}`,
        description: `Han pasado ${daysSince} días desde el último contacto con ${contact.name} (champion). El engagement podría estar deteriorándose.`,
        data: { contactName: contact.name, daysSince },
      })
    }
  }

  // 3. Renewal approaching without active plan
  if (ctx.renewalDate) {
    const daysToRenewal = Math.floor((new Date(ctx.renewalDate).getTime() - now) / 86400000)
    if (daysToRenewal > 0 && daysToRenewal <= 90) {
      const hasActivePlan = ctx.plans.length > 0
      if (!hasActivePlan) {
        insights.push({
          type: 'renewal_no_plan',
          severity: daysToRenewal <= 30 ? 'critical' : 'warning',
          title: `Renovación en ${daysToRenewal} días sin plan activo`,
          description: `La renovación es el ${ctx.renewalDate} y no hay un plan de éxito activo. Crea un plan de renovación para asegurar la retención.`,
          data: { renewalDate: ctx.renewalDate, daysToRenewal },
        })
      }
    }
  }

  // 4. Expansion opportunity — high health + high engagement
  if (ctx.healthScore != null && ctx.healthScore >= 80 && ctx.healthTrend === 'improving') {
    const productUsage = ctx.signals.find(s => s.key === 'product_usage')
    if (productUsage && productUsage.value >= 80) {
      insights.push({
        type: 'expansion_opportunity',
        severity: 'info',
        title: 'Oportunidad de expansión detectada',
        description: `Health score alto (${ctx.healthScore}), tendencia mejorando y uso de producto en ${productUsage.value}/100. Buen momento para proponer upsell o expansión.`,
        data: { healthScore: ctx.healthScore, productUsage: productUsage.value },
      })
    }
  }

  // 5. Overdue tasks
  const overdueTasks = ctx.tasks.filter(t => {
    if (!t.dueDate) return false
    return new Date(t.dueDate).getTime() < now
  })
  if (overdueTasks.length > 0) {
    insights.push({
      type: 'overdue_tasks',
      severity: overdueTasks.length >= 3 ? 'critical' : 'warning',
      title: `${overdueTasks.length} tarea${overdueTasks.length > 1 ? 's' : ''} vencida${overdueTasks.length > 1 ? 's' : ''}`,
      description: `Hay tareas pendientes con fecha de vencimiento pasada: ${overdueTasks.map(t => `"${t.title}"`).join(', ')}. Actualiza el estado o reprograma.`,
      data: { count: overdueTasks.length, tasks: overdueTasks.map(t => t.title) },
    })
  }

  // 6. No meetings in 30+ days
  const meetings = ctx.events.filter(e => e.type === 'meeting')
  if (meetings.length > 0) {
    const lastMeeting = meetings[0] // already sorted desc
    const daysSinceLastMeeting = Math.floor((now - new Date(lastMeeting.occurredAt).getTime()) / 86400000)
    if (daysSinceLastMeeting >= 30) {
      insights.push({
        type: 'no_recent_meetings',
        severity: daysSinceLastMeeting >= 60 ? 'critical' : 'warning',
        title: `Sin reuniones en ${daysSinceLastMeeting} días`,
        description: `La última reunión fue hace ${daysSinceLastMeeting} días ("${lastMeeting.title}"). Agenda un check-in para mantener el engagement.`,
        data: { daysSince: daysSinceLastMeeting, lastMeetingTitle: lastMeeting.title },
      })
    }
  } else if (ctx.events.length > 0) {
    // Has activity but zero meetings
    insights.push({
      type: 'no_recent_meetings',
      severity: 'warning',
      title: 'Sin reuniones registradas',
      description: 'No hay reuniones registradas en la actividad reciente. Agenda un check-in con el cliente.',
      data: {},
    })
  }

  return insights
}
