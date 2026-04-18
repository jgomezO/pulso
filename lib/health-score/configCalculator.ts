import type { SignalConfig } from './config'

export interface SignalValue {
  key: string
  value: number // 0–100
}

export function calculateScore(
  signals: SignalValue[],
  config: SignalConfig[]
): number {
  const activeSignals = config.filter(c => c.isActive)
  const totalWeight = activeSignals.reduce((sum, c) => sum + c.weight, 0)
  if (totalWeight === 0) return 0

  return Math.round(
    activeSignals.reduce((score, cfg) => {
      const signal = signals.find(s => s.key === cfg.key)
      const value = signal?.value ?? 50
      return score + (value * cfg.weight / totalWeight)
    }, 0)
  )
}
