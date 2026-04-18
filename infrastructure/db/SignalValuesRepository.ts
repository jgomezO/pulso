import { createServiceClient } from './supabase'
import type { SignalValue } from '@/lib/health-score/configCalculator'

export class SignalValuesRepository {
  private get db() {
    return createServiceClient()
  }

  async getByAccountId(accountId: string): Promise<SignalValue[]> {
    const { data, error } = await this.db
      .from('account_signal_values')
      .select('signal_key, value')
      .eq('account_id', accountId)

    if (error) throw error
    return (data ?? []).map(r => ({ key: r.signal_key as string, value: r.value as number }))
  }

  async upsertValues(accountId: string, values: SignalValue[]): Promise<void> {
    if (values.length === 0) return
    const rows = values.map(v => ({
      account_id: accountId,
      signal_key: v.key,
      value: v.value,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await this.db
      .from('account_signal_values')
      .upsert(rows, { onConflict: 'account_id,signal_key' })
    if (error) throw error
  }
}
