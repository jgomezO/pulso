export const EMAIL_TYPES = ['check-in', 'follow-up', 'escalation', 'renewal'] as const
export type EmailType = (typeof EMAIL_TYPES)[number]

export interface EmailComposerContact {
  name: string
  email: string
  title: string | null
  isChampion: boolean
  isDecisionMaker: boolean
}

export interface EmailComposerEvent {
  type: string
  title: string | null
  description: string | null
  occurredAt: string
}

export interface EmailComposerContext {
  emailType: EmailType
  accountName: string
  accountDomain: string | null
  tier: string | null
  arr: number | null
  healthScore: number | null
  healthTrend: string | null
  renewalDate: string | null
  renewalDaysLeft: number | null
  recipient: EmailComposerContact
  recentEvents: EmailComposerEvent[]
  openTickets: EmailComposerEvent[]
  additionalContext: string | null
}

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  'check-in': 'Check-in',
  'follow-up': 'Follow-up post reunión/llamada',
  'escalation': 'Escalación',
  'renewal': 'Renovación',
}

const WORD_LIMITS: Record<EmailType, number> = {
  'check-in': 150,
  'follow-up': 150,
  'escalation': 250,
  'renewal': 250,
}

export const EMAIL_COMPOSER_PROMPT = (ctx: EmailComposerContext): string => {
  const wordLimit = WORD_LIMITS[ctx.emailType]

  const eventLines = ctx.recentEvents.length > 0
    ? ctx.recentEvents.map(e =>
        `- [${e.type}] ${e.title ?? 'Sin título'}: ${e.description ?? 'Sin descripción'} (${e.occurredAt})`
      ).join('\n')
    : 'Sin eventos recientes registrados.'

  const ticketLines = ctx.openTickets.length > 0
    ? ctx.openTickets.map(e =>
        `- ${e.title ?? 'Ticket sin título'}: ${e.description ?? 'Sin descripción'} (${e.occurredAt})`
      ).join('\n')
    : 'Sin tickets abiertos.'

  const renewalLine = ctx.renewalDate
    ? `Fecha de renovación: ${ctx.renewalDate} (${ctx.renewalDaysLeft !== null ? `${ctx.renewalDaysLeft} días restantes` : 'sin cálculo'})`
    : 'Sin fecha de renovación configurada.'

  return `Eres un CSM (Customer Success Manager) profesional. Genera un email de tipo "${EMAIL_TYPE_LABELS[ctx.emailType]}" para enviar a un contacto de la cuenta.

## Datos de la cuenta
- Empresa: ${ctx.accountName}${ctx.accountDomain ? ` (${ctx.accountDomain})` : ''}
- Tier: ${ctx.tier ?? 'No especificado'}
- ARR: ${ctx.arr !== null ? `$${ctx.arr.toLocaleString()}` : 'No registrado'}
- Health Score: ${ctx.healthScore !== null ? `${ctx.healthScore}/100` : 'No calculado'}${ctx.healthTrend ? ` (tendencia: ${ctx.healthTrend})` : ''}
- ${renewalLine}

## Destinatario
- Nombre: ${ctx.recipient.name}
- Cargo: ${ctx.recipient.title ?? 'No especificado'}
- Rol: ${ctx.recipient.isChampion ? 'Champion' : ctx.recipient.isDecisionMaker ? 'Decision Maker' : 'Contacto'}

## Últimos 5 eventos del timeline
${eventLines}

## Tickets abiertos
${ticketLines}

${ctx.additionalContext ? `## Contexto adicional del CSM\n${ctx.additionalContext}` : ''}

## Reglas ESTRICTAS
1. Responde SOLO en formato JSON con exactamente dos campos: "subject" y "body"
2. El idioma por defecto es español. Si el nombre del destinatario sugiere inglés O el contexto adicional está en inglés, escribe en inglés.
3. Tono profesional pero cercano — como un colega, no como un robot corporativo.
4. Máximo ${wordLimit} palabras en el cuerpo.
5. Menciona al menos un dato real y específico de la cuenta (ticket, fecha, métrica, evento reciente).
6. NUNCA inventes datos que no estén en el contexto proporcionado.
7. El asunto debe ser corto y específico. "Seguimiento sobre el ticket de reportes" > "Seguimiento".
8. No incluyas firma ni "Saludos, [Nombre]" — el CSM agregará su propia firma.
9. Usa el nombre de pila del destinatario en el saludo (ej: "Hola María" no "Estimada María García").

${ctx.emailType === 'check-in' ? '## Instrucciones Check-in\nTono casual y breve. Para cuando no se ha hablado con el contacto en un tiempo. Pregunta cómo va todo con el producto.' : ''}
${ctx.emailType === 'follow-up' ? '## Instrucciones Follow-up\nReferencia eventos recientes del timeline (reuniones, llamadas). Resume lo discutido y próximos pasos si los hay.' : ''}
${ctx.emailType === 'escalation' ? '## Instrucciones Escalación\nTono más formal. Menciona tickets abiertos o caída del score. Dirigido a alguien con poder de decisión. Propón una llamada para resolver.' : ''}
${ctx.emailType === 'renewal' ? '## Instrucciones Renovación\nMenciona el valor entregado durante el periodo. Indica la fecha de renovación próxima. Propón agendar una reunión para discutir la renovación y próximos pasos.' : ''}

Responde SOLO con JSON válido:
{"subject": "...", "body": "..."}`.trim()
}

export interface EmailImproveContext {
  emailType: EmailType
  accountName: string
  recipientName: string
  recipientTitle: string | null
  currentSubject: string
  currentBody: string
  additionalContext: string | null
}

export const EMAIL_IMPROVE_PROMPT = (ctx: EmailImproveContext): string => {
  return `Eres un CSM (Customer Success Manager) profesional. Te dieron un borrador de email y necesitas mejorarlo.

## Tipo de email
${ctx.emailType}

## Cuenta
${ctx.accountName}

## Destinatario
- Nombre: ${ctx.recipientName}
- Cargo: ${ctx.recipientTitle ?? 'No especificado'}

## Borrador actual
Asunto: ${ctx.currentSubject}

${ctx.currentBody}

${ctx.additionalContext ? `## Instrucciones adicionales del CSM\n${ctx.additionalContext}` : ''}

## Reglas ESTRICTAS
1. Responde SOLO en formato JSON con exactamente dos campos: "subject" y "body"
2. Mantén el mismo idioma del borrador original.
3. Mejora la claridad, tono profesional y estructura del email.
4. Corrige errores gramaticales y de ortografía.
5. Mantén la esencia y los puntos clave del mensaje original — no cambies el propósito.
6. Hazlo más conciso si es posible, elimina redundancias.
7. Mejora el asunto para que sea más específico y atractivo.
8. No incluyas firma ni "Saludos, [Nombre]" — el CSM agregará su propia firma.
9. Usa el nombre de pila del destinatario en el saludo.

Responde SOLO con JSON válido:
{"subject": "...", "body": "..."}`.trim()
}
