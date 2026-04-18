export const SIGNAL_WEIGHTS = {
  product_usage: 0.30,
  support_tickets: 0.20,
  engagement: 0.20,
  nps: 0.15,
  payment_health: 0.10,
  stakeholder_activity: 0.05,
} as const

export type SignalKey = keyof typeof SIGNAL_WEIGHTS
