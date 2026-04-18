'use client'

import { Icon } from '@/components/shared/Icon'
import { IconTrendUp, IconTrendDown, IconTrendStable, IconWarning } from '@/lib/icons'
import { HealthScoreChart } from './HealthScoreChart'
import type { HealthScoreRecord } from '@/domain/account/HealthScore'
import { SIGNAL_WEIGHTS } from '@/lib/health-score/weights'

interface HealthScoreDetailProps {
  record: HealthScoreRecord | null
  previousScore?: number | null
  previousSignals?: Record<string, number | null> | null
}

const SIGNAL_CONFIG: {
  key: string
  label: string
  weightKey: keyof typeof SIGNAL_WEIGHTS
}[] = [
  { key: 'productUsageScore',  label: 'Uso del producto',   weightKey: 'product_usage'        },
  { key: 'engagementScore',    label: 'Engagement',          weightKey: 'engagement'           },
  { key: 'supportHealthScore', label: 'Salud de soporte',    weightKey: 'support_tickets'      },
  { key: 'npsScore',           label: 'Satisfacción (NPS)',  weightKey: 'nps'                  },
  { key: 'paymentScore',       label: 'Salud del contrato',  weightKey: 'payment_health'       },
  { key: 'stakeholderScore',   label: 'Stakeholders',        weightKey: 'stakeholder_activity' },
]

function barColor(value: number) {
  if (value >= 70) return 'bg-[#22C55E]'
  if (value >= 40) return 'bg-[#F58C37]'
  return 'bg-[#EF4444]'
}

export function HealthScoreDetail({ record, previousScore, previousSignals }: HealthScoreDetailProps) {
  if (!record) {
    return (
      <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-5 text-center">
        <p className="text-sm text-[#9CA3AF] py-4">Score no calculado aún.</p>
      </div>
    )
  }

  const delta = previousScore != null ? record.score - previousScore : null
  const scoreColor = record.score >= 70 ? '#22C55E' : record.score >= 40 ? '#F58C37' : '#EF4444'

  return (
    <div className="space-y-3">
      {/* Score + Chart card */}
      <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-4">
        {/* Score row */}
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-4xl font-bold tabular-nums" style={{ color: scoreColor }}>
            {record.score}
          </span>
          <span className="text-sm text-[#9CA3AF]">/ 100</span>
          {delta !== null && (
            <span className={`text-sm font-semibold ml-auto ${delta > 0 ? 'text-[#22C55E]' : delta < 0 ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
              {delta > 0
              ? <span className="inline-flex items-center gap-0.5"><Icon icon={IconTrendUp} size={12} /> +{delta}</span>
              : delta < 0
                ? <span className="inline-flex items-center gap-0.5"><Icon icon={IconTrendDown} size={12} /> {delta}</span>
                : <span className="inline-flex items-center gap-0.5"><Icon icon={IconTrendStable} size={12} /> Sin cambio</span>
            }
              <span className="text-[10px] font-normal text-[#9CA3AF] ml-1">vs anterior</span>
            </span>
          )}
        </div>

        {/* Chart */}
        <HealthScoreChart accountId={record.accountId} currentScore={record.score} />
      </div>

      {/* Breakdown card */}
      {record.signals && (
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-4">
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Desglose de señales</p>
          <div className="space-y-3">
            {SIGNAL_CONFIG.map(({ key, label, weightKey }) => {
              const value = (record.signals as Record<string, number | null>)?.[key]
              if (value === null || value === undefined) return null
              const weight   = SIGNAL_WEIGHTS[weightKey]
              const prevVal  = previousSignals?.[key]
              const sigDelta = prevVal != null ? value - prevVal : null
              const contribution = Math.round(value * weight)

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#6B7280]">{label}</span>
                      {value < 50 && <Icon icon={IconWarning} size={12} className="text-[#F58C37]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {sigDelta !== null && (
                        <span className={`text-[10px] font-semibold ${sigDelta > 0 ? 'text-[#22C55E]' : sigDelta < 0 ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
                          {sigDelta > 0
                            ? <span className="inline-flex items-center"><Icon icon={IconTrendUp} size={10} />+{sigDelta}</span>
                            : sigDelta < 0
                              ? <span className="inline-flex items-center"><Icon icon={IconTrendDown} size={10} />{sigDelta}</span>
                              : <Icon icon={IconTrendStable} size={10} />
                          }
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-[#0F1117] tabular-nums">{value}/100</span>
                      <span className="text-[10px] text-[#9CA3AF]">{Math.round(weight * 100)}%</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="relative h-1.5 bg-[#F7F8FC] rounded-full overflow-hidden" title={`Contribución al score total: +${contribution} puntos`}>
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor(value)}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
