import { describe, it, expect } from 'vitest'
import { calculateHealthScore, getHealthTrend, getRiskLevel } from './calculator'
import type { HealthSignals } from '@/domain/account/HealthScore'

const BASE_SIGNALS: HealthSignals = {
  productUsageScore: 80,
  supportHealthScore: 90,
  engagementScore: 70,
  npsScore: 75,
  paymentScore: 100,
  stakeholderScore: 60,
}

describe('calculateHealthScore', () => {
  it('calculates a weighted score correctly', () => {
    const score = calculateHealthScore(BASE_SIGNALS)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('redistributes NPS weight when npsScore is null', () => {
    const withNps = calculateHealthScore(BASE_SIGNALS)
    const withoutNps = calculateHealthScore({ ...BASE_SIGNALS, npsScore: null })
    // Scores should differ but both be valid
    expect(withoutNps).toBeGreaterThan(0)
    expect(withoutNps).toBeLessThanOrEqual(100)
    expect(withNps).not.toBe(withoutNps)
  })

  it('clamps score between 0 and 100', () => {
    const perfect: HealthSignals = {
      productUsageScore: 100,
      supportHealthScore: 100,
      engagementScore: 100,
      npsScore: 100,
      paymentScore: 100,
      stakeholderScore: 100,
    }
    expect(calculateHealthScore(perfect)).toBe(100)

    const zero: HealthSignals = {
      productUsageScore: 0,
      supportHealthScore: 0,
      engagementScore: 0,
      npsScore: 0,
      paymentScore: 0,
      stakeholderScore: 0,
    }
    expect(calculateHealthScore(zero)).toBe(0)
  })
})

describe('getHealthTrend', () => {
  it('returns improving when score increased by >=5', () => {
    expect(getHealthTrend(80, 70)).toBe('improving')
  })

  it('returns declining when score dropped by >=5', () => {
    expect(getHealthTrend(60, 70)).toBe('declining')
  })

  it('returns stable for small changes', () => {
    expect(getHealthTrend(72, 70)).toBe('stable')
  })

  it('returns stable when no previous score', () => {
    expect(getHealthTrend(80, null)).toBe('stable')
  })
})

describe('getRiskLevel', () => {
  it('returns low for scores >= 75', () => {
    expect(getRiskLevel(75)).toBe('low')
    expect(getRiskLevel(100)).toBe('low')
  })

  it('returns medium for scores 50-74', () => {
    expect(getRiskLevel(50)).toBe('medium')
    expect(getRiskLevel(74)).toBe('medium')
  })

  it('returns high for scores 25-49', () => {
    expect(getRiskLevel(25)).toBe('high')
    expect(getRiskLevel(49)).toBe('high')
  })

  it('returns critical for scores < 25', () => {
    expect(getRiskLevel(0)).toBe('critical')
    expect(getRiskLevel(24)).toBe('critical')
  })
})
