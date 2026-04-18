'use client'

import { useState, useEffect } from 'react'
import { Button, Slider, Switch } from '@heroui/react'
import { HealthScoreBadge } from '@/components/accounts/HealthScoreBadge'
import { SIGNAL_DEFINITIONS, DEFAULT_SIGNAL_CONFIG } from '@/lib/health-score/config'
import type { SignalConfig } from '@/lib/health-score/config'
import { calculateScore } from '@/lib/health-score/configCalculator'
import type { Account } from '@/domain/account/Account'

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? ''

// ── helpers ───────────────────────────────────────────────────────────────────

function activeWeight(signals: SignalConfig[]) {
  return signals.filter(s => s.isActive).reduce((sum, s) => sum + s.weight, 0)
}

function barColor(value: number) {
  if (value >= 70) return 'bg-green-500'
  if (value >= 40) return 'bg-amber-400'
  return 'bg-red-400'
}

// ── Section 1 — Signal config ─────────────────────────────────────────────────

function SignalConfigSection({
  config,
  onChange,
  onSave,
  saving,
}: {
  config: SignalConfig[]
  onChange: (c: SignalConfig[]) => void
  onSave: () => void
  saving: boolean
}) {
  const total = activeWeight(config)
  const isValid = total === 100

  function toggle(key: string) {
    onChange(config.map(s => s.key === key ? { ...s, isActive: !s.isActive } : s))
  }

  function setWeight(key: string, weight: number) {
    onChange(config.map(s => s.key === key ? { ...s, weight } : s))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Señales y pesos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Activa las señales que quieres usar y ajusta su peso. Deben sumar exactamente 100%.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold tabular-nums ${isValid ? 'text-green-600' : 'text-red-500'}`}>
            {total}% {isValid ? '✓' : '≠ 100'}
          </span>
          <Button variant="primary" onPress={onSave} isDisabled={saving || !isValid}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {config.map((signal) => {
          const def = SIGNAL_DEFINITIONS.find(d => d.key === signal.key)
          return (
            <div
              key={signal.key}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                signal.isActive ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-white opacity-50'
              }`}
            >
              <Switch.Root
                isSelected={signal.isActive}
                onChange={() => toggle(signal.key)}
                className="flex-shrink-0"
              >
                <Switch.Control className="w-10 h-6 rounded-full bg-gray-300 data-[selected]:bg-blue-600 transition-colors">
                  <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow translate-x-1 transition-transform data-[selected]:translate-x-5" />
                </Switch.Control>
              </Switch.Root>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{def?.label ?? signal.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{def?.description}</p>
              </div>

              <div className="flex items-center gap-3 w-56 flex-shrink-0">
                <Slider.Root
                  minValue={0}
                  maxValue={100}
                  step={5}
                  value={signal.weight}
                  isDisabled={!signal.isActive}
                  onChange={val => setWeight(signal.key, Array.isArray(val) ? val[0] : val)}
                  className="flex-1"
                >
                  <Slider.Track className="relative h-1.5 bg-gray-200 rounded-full">
                    <Slider.Fill className="absolute h-full bg-blue-500 rounded-full" />
                    <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow" />
                  </Slider.Track>
                </Slider.Root>
                <span className="text-sm font-semibold text-gray-700 w-10 text-right tabular-nums">
                  {signal.weight}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Score preview ─────────────────────────────────────────────────────────────

function ScorePreview({ score, previous }: { score: number; previous?: number | null }) {
  const diff = previous != null ? score - previous : null
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{score}</span>
      {diff !== null && diff !== 0 && (
        <span className={`text-xs font-semibold ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {diff > 0 ? `+${diff}` : diff}
        </span>
      )}
    </div>
  )
}

// ── Account score row ─────────────────────────────────────────────────────────

function AccountScoreRow({ account, config }: { account: Account; config: SignalConfig[] }) {
  const activeSignals = config.filter(s => s.isActive)
  const [values, setValues] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    fetch(`/api/accounts/${account.id}/signals`)
      .then(r => r.json())
      .then(data => {
        const map: Record<string, number> = {}
        for (const v of (data.values ?? [])) map[v.key] = v.value
        setValues(map)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [account.id])

  const signalValues = activeSignals.map(s => ({ key: s.key, value: values[s.key] ?? 50 }))
  const calculatedScore = calculateScore(signalValues, config)

  async function handleSave() {
    setSaving(true)
    setSavedMsg('')
    try {
      await fetch(`/api/accounts/${account.id}/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: signalValues }),
      })
      const res = await fetch(`/api/accounts/${account.id}/health-score/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: ORG_ID }),
      })
      if (res.ok) setSavedMsg('Guardado')
      else setSavedMsg('Error')
    } catch {
      setSavedMsg('Error')
    }
    setSaving(false)
    setTimeout(() => setSavedMsg(''), 2500)
  }

  if (!loaded) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{account.name}</p>
          {account.domain && <p className="text-xs text-gray-400">{account.domain}</p>}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Actual</p>
            <HealthScoreBadge score={account.healthScore} showTrend trend={account.healthTrend} />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Nuevo</p>
            <ScorePreview score={calculatedScore} previous={account.healthScore} />
          </div>
          <Button size="sm" variant="primary" onPress={handleSave} isDisabled={saving}>
            {saving ? 'Guardando...' : savedMsg || 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Signal sliders grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeSignals.map(signal => {
          const def   = SIGNAL_DEFINITIONS.find(d => d.key === signal.key)
          const value = values[signal.key] ?? 50
          const color = barColor(value)

          return (
            <div key={signal.key} className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-gray-600 truncate pr-2" title={def?.description}>
                  {def?.label ?? signal.label}
                </span>
                <span className="text-xs font-bold text-gray-800 tabular-nums flex-shrink-0">{value}</span>
              </div>

              {/* Bar */}
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${color}`}
                  style={{ width: `${value}%` }}
                />
              </div>

              {/* Slider */}
              <Slider.Root
                minValue={0}
                maxValue={100}
                step={5}
                value={value}
                onChange={val => setValues(prev => ({ ...prev, [signal.key]: Array.isArray(val) ? val[0] : val }))}
                className="w-full"
                aria-label={def?.description}
              >
                <Slider.Track className="relative h-1.5 bg-gray-200 rounded-full w-full">
                  <Slider.Fill className="absolute h-full bg-blue-500 rounded-full" />
                  <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow" />
                </Slider.Track>
              </Slider.Root>
              <div className="flex justify-between text-[10px] text-gray-300">
                <span>0 — bajo</span>
                <span>alto — 100</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HealthScoreSettingsPage() {
  const [config, setConfig] = useState<SignalConfig[]>(DEFAULT_SIGNAL_CONFIG)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/settings/health-score/config?orgId=${ORG_ID}`)
      .then(r => r.json())
      .then(data => { setConfig(data.signals); setConfigLoaded(true) })
      .catch(() => setConfigLoaded(true))
  }, [])

  useEffect(() => {
    fetch(`/api/accounts?orgId=${ORG_ID}&pageSize=100`)
      .then(r => r.json())
      .then(data => { setAccounts(data.data ?? []); setAccountsLoading(false) })
      .catch(() => setAccountsLoading(false))
  }, [])

  async function saveConfig() {
    setSavingConfig(true)
    await fetch('/api/settings/health-score/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: ORG_ID, signals: config }),
    })
    setSavingConfig(false)
  }

  return (
    <div>
      <div className="space-y-8 max-w-5xl">
        {configLoaded && (
          <SignalConfigSection
            config={config}
            onChange={setConfig}
            onSave={saveConfig}
            saving={savingConfig}
          />
        )}

        <div>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Score manual por cuenta</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Ajusta el valor de cada señal manualmente. El score se recalcula en tiempo real.
            </p>
          </div>

          {accountsLoading ? (
            <p className="text-sm text-gray-400">Cargando cuentas...</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-400">No hay cuentas activas</p>
          ) : (
            <div className="space-y-4">
              {accounts.map(account => (
                <AccountScoreRow key={account.id} account={account} config={config} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
