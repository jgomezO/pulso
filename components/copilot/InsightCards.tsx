'use client'

import { Button } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconInsight, IconDismiss, IconWarning, IconDanger, IconInfo, IconChevronDown } from '@/lib/icons'
import type { Insight } from '@/hooks/useInsights'
import { useState } from 'react'

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; iconComponent: typeof IconWarning }> = {
  critical: { bg: 'bg-[#FEE8E8]', border: 'border-[#FECACA]', icon: 'text-[#EF4444]', iconComponent: IconDanger },
  warning: { bg: 'bg-[#FEF3E8]', border: 'border-[#FDE68A]', icon: 'text-[#F58C37]', iconComponent: IconWarning },
  info: { bg: 'bg-[#EEF1FE]', border: 'border-[#C7D2FE]', icon: 'text-[#4F6EF7]', iconComponent: IconInfo },
}

function InsightCard({
  insight,
  onDismiss,
  onAskCopilot,
}: {
  insight: Insight
  onDismiss: (id: string) => void
  onAskCopilot: (question: string) => void
}) {
  const style = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.info
  const SeverityIcon = style.iconComponent

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-3 transition-all`}>
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 flex-shrink-0 ${style.icon}`}>
          <Icon icon={SeverityIcon} size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-xs font-semibold text-[#0F1117] leading-tight">{insight.title}</p>
            <Button
              isIconOnly size="sm" variant="ghost"
              onPress={() => onDismiss(insight.id)}
              className="h-5 w-5 min-w-0 text-[#9CA3AF] hover:text-[#6B7280] flex-shrink-0"
            >
              <Icon icon={IconDismiss} size={10} />
            </Button>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">{insight.description}</p>
          <button
            type="button"
            onClick={() => onAskCopilot(insight.title)}
            className="mt-1.5 text-[10px] font-medium text-[#4F6EF7] hover:underline"
          >
            Preguntar al Copilot
          </button>
        </div>
      </div>
    </div>
  )
}

export function InsightSection({
  insights,
  onDismiss,
  onAskCopilot,
}: {
  insights: Insight[]
  onDismiss: (id: string) => void
  onAskCopilot: (question: string) => void
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (insights.length === 0) return null

  const criticalCount = insights.filter(i => i.severity === 'critical').length
  const warningCount = insights.filter(i => i.severity === 'warning').length

  return (
    <div className="mx-4 mb-3">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full mb-2"
      >
        <div className="flex items-center gap-1.5">
          <Icon icon={IconInsight} size={14} className="text-[#F58C37]" />
          <span className="text-xs font-semibold text-[#0F1117]">
            {insights.length} insight{insights.length > 1 ? 's' : ''}
          </span>
          {criticalCount > 0 && (
            <span className="text-[9px] font-semibold text-[#EF4444] bg-[#FEE8E8] px-1.5 py-0.5 rounded">
              {criticalCount} critico{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[9px] font-semibold text-[#F58C37] bg-[#FEF3E8] px-1.5 py-0.5 rounded">
              {warningCount} alerta{warningCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Icon
          icon={IconChevronDown}
          size={12}
          className={`text-[#9CA3AF] transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
        />
      </button>

      {!isCollapsed && (
        <div className="space-y-2">
          {insights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={onDismiss}
              onAskCopilot={onAskCopilot}
            />
          ))}
        </div>
      )}
    </div>
  )
}
