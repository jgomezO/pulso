import type { AccountSummaryContext } from './account-summary.prompt'

export interface MeetingBriefContext extends AccountSummaryContext {
  contacts: Array<{ name: string; role: string; isChampion: boolean; isDecisionMaker: boolean }>
  lastMeetingDate: string | null
  openRisks: string[]
}

export const MEETING_BRIEF_PROMPT = (context: MeetingBriefContext): string => `
You are a Customer Success AI. Generate a meeting brief in Spanish for a CSM
about to meet with this account.

Account: ${context.name}
ARR: ${context.arr}
Health Score: ${context.healthScore}/100 (${context.trend})
Renewal: ${context.renewalDate}
Last meeting: ${context.lastMeetingDate ?? 'No data'}

Key contacts:
${context.contacts.map(c => `- ${c.name} (${c.role})${c.isChampion ? ' [Champion]' : ''}${c.isDecisionMaker ? ' [Decision Maker]' : ''}`).join('\n')}

Recent events:
${context.recentEvents.map(e => `- [${e.type}] ${e.title} (${e.occurredAt})`).join('\n')}

Open risks:
${context.openRisks.length > 0 ? context.openRisks.map(r => `- ${r}`).join('\n') : '- None identified'}

Generate a structured brief in Spanish with:
1. **Contexto** (1-2 sentences about current account status)
2. **Puntos clave para discutir** (3-5 bullet points)
3. **Riesgos a mencionar** (1-3 risks if any)
4. **Objetivo de la reunión** (1 sentence)

Be specific and actionable. Use the data provided.
`.trim()
