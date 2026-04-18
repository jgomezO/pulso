'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/shared/Icon'
import { IconChevronRight } from '@/lib/icons'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { AccountTask } from '@/domain/task/AccountTask'
import { formatDate, daysUntil } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/format'

interface ActivePlan {
  id:          string
  title:       string
  progress:    number
  targetDate:  string | null
  accountId:   string
  accountName: string | null
}

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? 'demo-org-id'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', className: 'bg-[#FEE8E8] text-[#EF4444]' },
  high:   { label: 'Alta',    className: 'bg-[#FEF3E8] text-[#F58C37]' },
  medium: { label: 'Media',   className: 'bg-[#EEF1FE] text-[#4F6EF7]' },
  low:    { label: 'Baja',    className: 'bg-[#F7F8FC] text-[#6B7280]' },
} as const

function DueDateBadge({ dateStr }: { dateStr: string | null | undefined }) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(dateStr + 'T00:00:00')
  const diff  = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0)   return <span className="text-[11px] font-semibold text-[#EF4444]">Vencida</span>
  if (diff === 0) return <span className="text-[11px] font-semibold text-[#4F6EF7]">Hoy</span>
  return <span className="text-[11px] text-[#9CA3AF]">{formatDate(dateStr)}</span>
}

interface KPIs {
  totalAccounts: number
  newThisMonth: number
  totalArr: number
  avgArr: number
  atRiskCount: number
  atRiskArr: number
  renewingCount: number
  nextRenewalName: string | null
  nextRenewalDays: number | null
}

interface AttentionAccount {
  id: string
  name: string
  healthScore: number | null
  arr: number | null
  renewalDate: string | null
  riskLevel: string | null
  reasons: string[]
  urgency: number
}

export default function HomePage() {
  const { userId, isLoading: userLoading } = useCurrentUser()
  const [tasks,       setTasks]       = useState<AccountTask[]>([])
  const [tasksLoad,   setTasksLoad]   = useState(true)
  const [kpis,        setKpis]        = useState<KPIs | null>(null)
  const [kpisLoad,    setKpisLoad]    = useState(true)
  const [attention,   setAttention]   = useState<AttentionAccount[]>([])
  const [attentionLoad, setAttentionLoad] = useState(true)
  const [activePlans,   setActivePlans]   = useState<ActivePlan[]>([])
  const [plansLoad,     setPlansLoad]     = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/kpis?orgId=${ORG_ID}`)
      .then(r => r.json())
      .then(d => { setKpis(d); setKpisLoad(false) })
      .catch(() => setKpisLoad(false))

    fetch(`/api/dashboard/attention?orgId=${ORG_ID}`)
      .then(r => r.json())
      .then(d => { setAttention(d.accounts ?? []); setAttentionLoad(false) })
      .catch(() => setAttentionLoad(false))

    fetch(`/api/dashboard/plans?orgId=${ORG_ID}`)
      .then(r => r.json())
      .then(d => { setActivePlans(d.plans ?? []); setPlansLoad(false) })
      .catch(() => setPlansLoad(false))
  }, [])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/tasks?userId=${userId}&status=pending&pageSize=10`)
      .then(r => r.json())
      .then(d => { setTasks(d.data ?? []); setTasksLoad(false) })
      .catch(() => setTasksLoad(false))
  }, [userId])

  async function handleComplete(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'completed' }),
    })
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const kpiCards = [
    {
      label: 'Cuentas totales',
      value: kpisLoad ? '—' : String(kpis?.totalAccounts ?? 0),
      sub:   kpisLoad ? '' : `+${kpis?.newThisMonth ?? 0} nuevas este mes`,
      gradient: true,
    },
    {
      label: 'ARR gestionado',
      value: kpisLoad ? '—' : formatCurrency(kpis?.totalArr ?? 0),
      sub:   kpisLoad ? '' : `Promedio: ${formatCurrency(kpis?.avgArr ?? 0)} por cuenta`,
      gradient: false,
    },
    {
      label: 'En riesgo',
      value: kpisLoad ? '—' : String(kpis?.atRiskCount ?? 0),
      sub:   kpisLoad ? '' : `ARR en riesgo: ${formatCurrency(kpis?.atRiskArr ?? 0)}`,
      gradient: false,
      danger: true,
    },
    {
      label: 'Renovaciones próximas',
      value: kpisLoad ? '—' : String(kpis?.renewingCount ?? 0),
      sub:   kpisLoad
        ? ''
        : kpis?.nextRenewalName
          ? `Próxima: ${kpis.nextRenewalName} en ${kpis.nextRenewalDays}d`
          : 'Sin renovaciones en 90d',
      gradient: false,
    },
  ]

  return (
    <div>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => (
            <div
              key={i}
              className={`rounded-[14px] p-5 ${
                card.gradient
                  ? 'bg-gradient-to-br from-[#4F6EF7] to-[#6C4EF2] text-white'
                  : card.danger
                    ? 'bg-white border border-[#EF4444]/20'
                    : 'bg-white border border-[#ECEEF5]'
              }`}
            >
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${card.gradient ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                {card.label}
              </p>
              <p className={`text-[28px] font-semibold leading-none ${
                card.gradient ? 'text-white' : card.danger ? 'text-[#EF4444]' : 'text-[#0F1117]'
              }`}>
                {card.value}
              </p>
              <p className={`text-xs mt-2 ${card.gradient ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Active plans */}
        {(plansLoad || activePlans.length > 0) && (
          <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0F1117]">Planes activos</h2>
              <Link href="/accounts" className="inline-flex items-center gap-0.5 text-xs text-[#4F6EF7] hover:underline">Ver cuentas <Icon icon={IconChevronRight} size={12} /></Link>
            </div>
            {plansLoad ? (
              <TableSkeleton rows={2} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activePlans.map(plan => {
                  const isOverdue = plan.targetDate && plan.progress < 100 && new Date(plan.targetDate) < new Date()
                  return (
                    <Link key={plan.id} href={`/accounts/${plan.accountId}?tab=plans`} className="block">
                      <div className={`border rounded-xl p-3 hover:border-[#4F6EF7]/40 transition-colors ${isOverdue ? 'border-[#EF4444]/30 bg-[#FEE8E8]/10' : 'border-[#ECEEF5]'}`}>
                        <p className="text-[10px] text-[#9CA3AF] truncate">{plan.accountName}</p>
                        <p className="text-xs font-semibold text-[#0F1117] mt-0.5 truncate">{plan.title}</p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-semibold ${plan.progress === 100 ? 'text-[#22C55E]' : isOverdue ? 'text-[#EF4444]' : 'text-[#4F6EF7]'}`}>{plan.progress}%</span>
                            {plan.targetDate && (
                              <span className={`text-[10px] ${isOverdue ? 'text-[#EF4444] font-semibold' : 'text-[#9CA3AF]'}`}>{formatDate(plan.targetDate)}</span>
                            )}
                          </div>
                          <div className="h-1 bg-[#F7F8FC] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${plan.progress === 100 ? 'bg-[#22C55E]' : isOverdue ? 'bg-[#EF4444]' : 'bg-[#4F6EF7]'}`}
                              style={{ width: `${plan.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attention section */}
          <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0F1117]">Necesitan atención hoy</h2>
              <Link href="/accounts?risk=high" className="inline-flex items-center gap-0.5 text-xs text-[#4F6EF7] hover:underline">
                Ver todas <Icon icon={IconChevronRight} size={12} />
              </Link>
            </div>

            {attentionLoad ? (
              <TableSkeleton rows={3} />
            ) : attention.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-6">Sin cuentas urgentes</p>
            ) : (
              <div className="space-y-0">
                {attention.map(acct => {
                  const score = acct.healthScore
                  const scoreStyle = score == null ? 'bg-[#F7F8FC] text-[#9CA3AF]'
                    : score >= 70 ? 'bg-[#E8FAF0] text-[#22C55E]'
                    : score >= 40 ? 'bg-[#FEF3E8] text-[#F58C37]'
                    : 'bg-[#FEE8E8] text-[#EF4444]'
                  const renewDays = daysUntil(acct.renewalDate)

                  return (
                    <div key={acct.id} className="flex items-start gap-3 py-3 border-b border-[#ECEEF5] last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/accounts/${acct.id}`} className="text-sm font-medium text-[#0F1117] hover:text-[#4F6EF7] transition-colors truncate">
                            {acct.name}
                          </Link>
                          {score != null && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${scoreStyle}`}>
                              {score}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {acct.reasons.map((r, i) => (
                            <span key={i} className="text-[10px] text-[#6B7280] bg-[#F7F8FC] px-1.5 py-0.5 rounded-md">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Link href={`/accounts/${acct.id}`}>
                        <button className="inline-flex items-center gap-0.5 h-7 px-2.5 border border-[#ECEEF5] text-[#6B7280] rounded-lg text-xs font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors flex-shrink-0">
                          Ver <Icon icon={IconChevronRight} size={12} />
                        </button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pending tasks */}
          <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0F1117]">Mis tareas pendientes</h2>
              <Link href="/tasks" className="inline-flex items-center gap-0.5 text-xs text-[#4F6EF7] hover:underline">
                Ver todas <Icon icon={IconChevronRight} size={12} />
              </Link>
            </div>

            {tasksLoad || userLoading ? (
              <TableSkeleton rows={4} />
            ) : tasks.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-6">Sin tareas pendientes</p>
            ) : (
              <div>
                {tasks.map(task => {
                  const prio = PRIORITY_CONFIG[task.priority]
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-2.5 border-b border-[#ECEEF5] last:border-0"
                    >
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="w-4 h-4 rounded-full border-2 border-[#D1D5DB] hover:border-[#22C55E] flex-shrink-0 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#0F1117] truncate">{task.title}</p>
                        {task.accountName && (
                          <Link href={`/accounts/${task.accountId}`} className="text-[11px] text-[#9CA3AF] hover:text-[#4F6EF7] transition-colors">
                            {task.accountName}
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${prio.className}`}>
                          {prio.label}
                        </span>
                        <DueDateBadge dateStr={task.dueDate} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
