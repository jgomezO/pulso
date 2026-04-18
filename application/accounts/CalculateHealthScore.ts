import { calculateHealthScore, getHealthTrend, getRiskLevel } from '@/lib/health-score/calculator'
import type { HealthSignals } from '@/domain/account/HealthScore'
import type { AccountRepository } from '@/domain/account/AccountRepository'
import { createServiceClient } from '@/infrastructure/db/supabase'

export class CalculateHealthScore {
  constructor(private accountRepo: AccountRepository) {}

  async execute(
    accountId: string,
    orgId: string,
    signals: HealthSignals
  ): Promise<{ score: number; trend: string; riskLevel: string }> {
    const db = createServiceClient()

    // Get previous score for trend calculation
    const { data: lastRecord } = await db
      .from('health_score_history')
      .select('score')
      .eq('account_id', accountId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    const previousScore = lastRecord?.score ?? null
    const score = calculateHealthScore(signals)
    const trend = getHealthTrend(score, previousScore)
    const riskLevel = getRiskLevel(score)

    // Persist history record
    await db.from('health_score_history').insert({
      account_id: accountId,
      score,
      signals: signals as unknown as Record<string, unknown>,
    })

    // Update account
    await this.accountRepo.updateHealthScore(accountId, orgId, score, trend)

    return { score, trend, riskLevel }
  }
}
