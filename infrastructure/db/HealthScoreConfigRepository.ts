import { createServiceClient } from './supabase'
import { DEFAULT_SIGNAL_CONFIG } from '@/lib/health-score/config'
import type { SignalConfig } from '@/lib/health-score/config'

export class HealthScoreConfigRepository {
  private get db() {
    return createServiceClient()
  }

  async getConfig(orgId: string): Promise<SignalConfig[]> {
    const { data } = await this.db
      .from('health_score_configs')
      .select('signals')
      .eq('org_id', orgId)
      .single()

    if (!data) return DEFAULT_SIGNAL_CONFIG
    return data.signals as SignalConfig[]
  }

  async saveConfig(orgId: string, signals: SignalConfig[]): Promise<void> {
    const { error } = await this.db
      .from('health_score_configs')
      .upsert(
        { org_id: orgId, signals, updated_at: new Date().toISOString() },
        { onConflict: 'org_id' }
      )
    if (error) throw error
  }
}
