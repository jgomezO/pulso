import type { HealthSignals } from '@/domain/account/HealthScore'

export interface HealthNarrativeContact {
  name: string
  lastContactDaysAgo: number | null
}

export interface HealthNarrativeEvent {
  type: string
  description: string
  daysAgo: number
}

export interface HealthNarrativeContext {
  accountName: string
  score: number
  previousScore: number | null
  signals: HealthSignals
  previousSignals: HealthSignals | null
  tier: string | null
  renewalDate: string | null
  champion: HealthNarrativeContact | null
  decisionMaker: HealthNarrativeContact | null
  recentEvents: HealthNarrativeEvent[]
  signalsConfigured: boolean
}

export const NO_SIGNALS_MESSAGE =
  'No hay datos de señales configurados para esta cuenta. Configura las señales del Health Score para obtener un análisis detallado.'

export const HEALTH_NARRATIVE_PROMPT = (ctx: HealthNarrativeContext): string => {
  const scoreDelta = ctx.previousScore !== null ? ctx.score - ctx.previousScore : null
  const trendLabel =
    scoreDelta !== null
      ? scoreDelta > 0
        ? `subió ${scoreDelta} puntos`
        : scoreDelta < 0
          ? `bajó ${Math.abs(scoreDelta)} puntos`
          : 'se mantuvo igual'
      : 'sin historial previo'

  const signalLines = [
    `- Uso de producto: ${ctx.signals.productUsageScore}/100${ctx.previousSignals ? ` (antes: ${ctx.previousSignals.productUsageScore})` : ''}`,
    `- Salud de soporte: ${ctx.signals.supportHealthScore}/100${ctx.previousSignals ? ` (antes: ${ctx.previousSignals.supportHealthScore})` : ''}`,
    `- Engagement: ${ctx.signals.engagementScore}/100${ctx.previousSignals ? ` (antes: ${ctx.previousSignals.engagementScore})` : ''}`,
    `- NPS: ${ctx.signals.npsScore !== null ? `${ctx.signals.npsScore}/100` : 'Sin dato'}${ctx.previousSignals?.npsScore !== null && ctx.previousSignals?.npsScore !== undefined ? ` (antes: ${ctx.previousSignals.npsScore})` : ''}`,
    `- Pagos: ${ctx.signals.paymentScore}/100${ctx.previousSignals ? ` (antes: ${ctx.previousSignals.paymentScore})` : ''}`,
    `- Stakeholders: ${ctx.signals.stakeholderScore}/100${ctx.previousSignals ? ` (antes: ${ctx.previousSignals.stakeholderScore})` : ''}`,
  ].join('\n')

  const contactLines: string[] = []
  if (ctx.champion) {
    contactLines.push(
      `- Champion: ${ctx.champion.name}${ctx.champion.lastContactDaysAgo !== null ? ` (último contacto hace ${ctx.champion.lastContactDaysAgo} días)` : ' (sin contacto registrado)'}`
    )
  }
  if (ctx.decisionMaker) {
    contactLines.push(
      `- Decision Maker: ${ctx.decisionMaker.name}${ctx.decisionMaker.lastContactDaysAgo !== null ? ` (último contacto hace ${ctx.decisionMaker.lastContactDaysAgo} días)` : ' (sin contacto registrado)'}`
    )
  }

  const eventLines =
    ctx.recentEvents.length > 0
      ? ctx.recentEvents.map((e) => `- ${e.type}: ${e.description} (hace ${e.daysAgo} días)`).join('\n')
      : '- Sin eventos recientes'

  const renewalLine = ctx.renewalDate
    ? `Fecha de renovación: ${ctx.renewalDate}`
    : 'Sin fecha de renovación configurada'

  return `Eres un analista de Customer Success. Genera un análisis narrativo en español (3-4 oraciones) del health score de esta cuenta.

Cuenta: ${ctx.accountName}
Tier: ${ctx.tier ?? 'No especificado'}
${renewalLine}
Score actual: ${ctx.score}/100 (${trendLabel})

Señales:
${signalLines}

Contactos clave:
${contactLines.length > 0 ? contactLines.join('\n') : '- Sin contactos clave identificados'}

Eventos recientes (últimos 7 días):
${eventLines}

Reglas:
- Escribe EXACTAMENTE 3-4 oraciones en español
- ${ctx.score < 50 ? 'Usa tono URGENTE — la cuenta está en riesgo' : ctx.score >= 70 ? 'Tono positivo pero menciona áreas de mejora' : 'Tono neutro, identifica qué mejorar'}
${scoreDelta !== null && Math.abs(scoreDelta) > 20 ? '- IMPORTANTE: Hubo un cambio significativo de score, explica las causas probables' : ''}
- Menciona datos concretos: nombres de contactos, días sin contacto, porcentajes de señales
- Incluye una recomendación accionable al final
- NO uses markdown, solo texto plano
- NO repitas el score numérico, el usuario ya lo ve`.trim()
}
