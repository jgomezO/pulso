export interface AccountSummaryContext {
  name: string
  arr: string
  healthScore: number
  trend: string
  renewalDate: string
  recentEvents: Array<{ type: string; title: string; occurredAt: string }>
  openTickets: number
  usageSummary: string
}

export const ACCOUNT_SUMMARY_PROMPT = (context: AccountSummaryContext): string => `
You are a Customer Success analyst. Given the following account data,
generate a concise 3-sentence executive summary in Spanish that a CSM
can read in 30 seconds before a customer call.

Focus on: current health, key risks, most important recent event.
Never mention raw numbers without context. Be specific, not generic.

Account data:
- Name: ${context.name}
- ARR: ${context.arr}
- Health Score: ${context.healthScore}/100 (${context.trend})
- Renewal: ${context.renewalDate}
- Recent events: ${JSON.stringify(context.recentEvents, null, 2)}
- Open tickets: ${context.openTickets}
- Product usage (last 30d): ${context.usageSummary}

Respond in Spanish. Maximum 3 sentences. Be direct and actionable.
`.trim()
