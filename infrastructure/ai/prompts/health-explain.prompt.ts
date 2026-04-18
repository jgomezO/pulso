import type { HealthSignals } from '@/domain/account/HealthScore'

export interface HealthExplainContext {
  accountName: string
  score: number
  previousScore: number | null
  signals: HealthSignals
}

export const HEALTH_EXPLAIN_PROMPT = (context: HealthExplainContext): string => `
You are a Customer Success AI. Explain in plain Spanish (2-3 sentences) why this account
has a health score of ${context.score}/100.

Account: ${context.accountName}
${context.previousScore !== null ? `Previous score: ${context.previousScore}/100` : ''}

Signal breakdown:
- Product usage: ${context.signals.productUsageScore}/100
- Support health: ${context.signals.supportHealthScore}/100 (100 = no critical tickets)
- Engagement: ${context.signals.engagementScore}/100
- NPS: ${context.signals.npsScore !== null ? `${context.signals.npsScore}/100` : 'No data'}
- Payment health: ${context.signals.paymentScore}/100
- Stakeholder activity: ${context.signals.stakeholderScore}/100

Explain the main drivers of the score. Mention what's working well and what's at risk.
Be specific and actionable. Maximum 3 sentences in Spanish.
`.trim()
