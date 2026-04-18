interface HealthScoreBadgeProps {
  score: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showTrend?: boolean
  trend?: string | null
}

function getScoreStyle(score: number) {
  if (score >= 70) return 'bg-[#E8FAF0] text-[#22C55E]'
  if (score >= 40) return 'bg-[#FEF3E8] text-[#F58C37]'
  return 'bg-[#FEE8E8] text-[#EF4444]'
}

import { Icon } from '@/components/shared/Icon'
import { IconTrendUp, IconTrendDown, IconTrendStable } from '@/lib/icons'

function getTrendIconComponent(trend: string | null | undefined) {
  if (trend === 'improving') return IconTrendUp
  if (trend === 'declining') return IconTrendDown
  return IconTrendStable
}

export function HealthScoreBadge({ score, size = 'md', showTrend, trend }: HealthScoreBadgeProps) {
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1.5' : size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'

  if (score == null) {
    return (
      <span className={`inline-flex items-center font-medium rounded-md bg-[#F7F8FC] text-[#9CA3AF] ${sizeClass}`}>
        Sin datos
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center font-semibold rounded-md ${getScoreStyle(score)} ${sizeClass}`}>
        {score}
      </span>
      {showTrend && trend && (
        <span
          className={`text-xs font-medium ${
            trend === 'improving' ? 'text-[#22C55E]' :
            trend === 'declining' ? 'text-[#EF4444]' :
            'text-[#9CA3AF]'
          }`}
        >
          <Icon icon={getTrendIconComponent(trend)} size={12} />
        </span>
      )}
    </div>
  )
}
