import { SIGNAL_WEIGHTS } from './weights'
import type { HealthSignals } from '@/domain/account/HealthScore'

type WeightMap = Record<string, number>

export function calculateHealthScore(signals: HealthSignals): number {
  const baseWeights: WeightMap = { ...SIGNAL_WEIGHTS }
  const hasNps = signals.npsScore !== null

  let weights: WeightMap = { ...baseWeights }

  if (!hasNps) {
    const npsWeight = baseWeights['nps'] ?? 0
    const otherTotal = 1 - npsWeight
    weights = {
      product_usage: (baseWeights['product_usage'] ?? 0) + ((baseWeights['product_usage'] ?? 0) / otherTotal) * npsWeight,
      support_tickets: (baseWeights['support_tickets'] ?? 0) + ((baseWeights['support_tickets'] ?? 0) / otherTotal) * npsWeight,
      engagement: (baseWeights['engagement'] ?? 0) + ((baseWeights['engagement'] ?? 0) / otherTotal) * npsWeight,
      nps: 0,
      payment_health: (baseWeights['payment_health'] ?? 0) + ((baseWeights['payment_health'] ?? 0) / otherTotal) * npsWeight,
      stakeholder_activity: (baseWeights['stakeholder_activity'] ?? 0) + ((baseWeights['stakeholder_activity'] ?? 0) / otherTotal) * npsWeight,
    }
  }

  const score =
    signals.productUsageScore * (weights['product_usage'] ?? 0) +
    signals.supportHealthScore * (weights['support_tickets'] ?? 0) +
    signals.engagementScore * (weights['engagement'] ?? 0) +
    (signals.npsScore ?? 0) * (weights['nps'] ?? 0) +
    signals.paymentScore * (weights['payment_health'] ?? 0) +
    signals.stakeholderScore * (weights['stakeholder_activity'] ?? 0)

  return Math.round(Math.max(0, Math.min(100, score)))
}

export function getHealthTrend(
  currentScore: number,
  previousScore: number | null
): 'improving' | 'stable' | 'declining' {
  if (previousScore === null) return 'stable'
  const delta = currentScore - previousScore
  if (delta >= 5) return 'improving'
  if (delta <= -5) return 'declining'
  return 'stable'
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'low'
  if (score >= 50) return 'medium'
  if (score >= 25) return 'high'
  return 'critical'
}
