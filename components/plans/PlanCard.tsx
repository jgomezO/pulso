'use client'

import type { SuccessPlan, PlanTemplateType } from '@/domain/plan/SuccessPlan'
import { formatDate } from '@/lib/utils/date'
import { Icon } from '@/components/shared/Icon'
import { IconWarning } from '@/lib/icons'

const TEMPLATE_CONFIG: Record<PlanTemplateType | string, { label: string; color: string; bgColor: string }> = {
  onboarding: { label: 'Onboarding',    color: 'text-[#22C55E]',  bgColor: 'bg-[#E8FAF0]'  },
  at_risk:    { label: 'En riesgo',     color: 'text-[#EF4444]',  bgColor: 'bg-[#FEE8E8]'  },
  renewal:    { label: 'Renovación',    color: 'text-[#4F6EF7]',  bgColor: 'bg-[#EEF1FE]'  },
  expansion:  { label: 'Expansión',     color: 'text-[#6C4EF2]',  bgColor: 'bg-[#F0EEFF]'  },
  custom:     { label: 'Personalizado', color: 'text-[#6B7280]',  bgColor: 'bg-[#F7F8FC]'  },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: 'Activo',     color: 'text-[#4F6EF7]'  },
  completed: { label: 'Completado', color: 'text-[#22C55E]'  },
  paused:    { label: 'Pausado',    color: 'text-[#F58C37]'  },
  cancelled: { label: 'Cancelado',  color: 'text-[#9CA3AF]'  },
}

interface PlanCardProps {
  plan:       SuccessPlan
  isExpanded: boolean
  onToggle:   () => void
  taskCount?:    number
  doneCount?:    number
}

export function PlanCard({ plan, isExpanded, onToggle, taskCount, doneCount }: PlanCardProps) {
  const tmplCfg  = TEMPLATE_CONFIG[plan.templateType ?? 'custom'] ?? TEMPLATE_CONFIG.custom
  const statusCfg = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.active
  const isOverdue = plan.targetDate && plan.progress < 100 && new Date(plan.targetDate) < new Date()

  return (
    <div
      className={`bg-white border rounded-[14px] p-4 cursor-pointer transition-colors hover:border-[#4F6EF7]/40 ${
        isExpanded ? 'border-[#4F6EF7]/40' : isOverdue ? 'border-[#EF4444]/30' : 'border-[#ECEEF5]'
      }`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {plan.templateType && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${tmplCfg.bgColor} ${tmplCfg.color}`}>
                {tmplCfg.label}
              </span>
            )}
            <span className={`text-[10px] font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
            {isOverdue && <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#EF4444]"><Icon icon={IconWarning} size={12} /> Atrasado</span>}
          </div>
          <p className="text-sm font-semibold text-[#0F1117]">{plan.title}</p>
          {plan.objective && (
            <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{plan.objective}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg font-bold tabular-nums text-[#4F6EF7]">{plan.progress}%</span>
          <svg
            className={`w-4 h-4 text-[#9CA3AF] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-1.5 bg-[#F7F8FC] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              plan.progress === 100 ? 'bg-[#22C55E]' : plan.progress > 50 ? 'bg-[#4F6EF7]' : 'bg-[#F58C37]'
            }`}
            style={{ width: `${plan.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-[#9CA3AF]">
            {taskCount != null ? `${doneCount ?? 0} de ${taskCount} tareas completadas` : ''}
          </p>
          {plan.targetDate && (
            <p className={`text-[10px] font-medium ${isOverdue ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
              Objetivo: {formatDate(plan.targetDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
