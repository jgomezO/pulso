export interface AccountContext {
  name: string
  domain: string | null
  tier: string | null
  arr: number | null
  mrr: number | null
  industry: string | null
  renewalDate: string | null
  healthScore: number | null
  healthTrend: string | null
  riskLevel: string | null
  contacts: {
    name: string
    email: string | null
    roleType: string
    isChampion: boolean
    isDecisionMaker: boolean
    lastContactedAt: string | null
  }[]
  signals: {
    key: string
    label: string
    value: number
    weight: number
  }[]
  events: {
    type: string
    title: string
    description: string | null
    sentiment: string | null
    occurredAt: string
  }[]
  tasks: {
    title: string
    priority: string
    dueDate: string | null
  }[]
  plans: {
    title: string
    objective: string | null
    progress: number
    milestones: {
      title: string
      isCompleted: boolean
      completedAt: string | null
    }[]
  }[]
  healthHistory: {
    score: number
    calculatedAt: string
  }[]
  activitySummary: string | null
}
