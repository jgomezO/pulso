'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { Separator } from '@heroui/react'
import { useAccount } from '@/hooks/useAccount'
import { useHealthScore } from '@/hooks/useHealthScore'
import { useAccountSummary } from '@/hooks/useAccountSummary'
import { AccountTimeline } from '@/components/accounts/AccountTimeline'
import { TasksSection } from '@/components/accounts/TasksSection'
import { PlansSection } from '@/components/accounts/PlansSection'
import { ContactsSection } from '@/components/accounts/ContactsSection'
import { HealthScoreDetail } from '@/components/accounts/HealthScoreDetail'
import { CsmNotesSection } from '@/components/accounts/CsmNotesSection'
import { MeetingBriefModal } from '@/components/accounts/MeetingBriefModal'
import { SyncButtons } from '@/components/accounts/SyncButtons'
import { AIInsightCard } from '@/components/shared/AIInsightCard'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency } from '@/lib/utils/format'
import { formatDate, daysUntil } from '@/lib/utils/date'
import { Icon } from '@/components/shared/Icon'
import { IconTrendUp, IconTrendDown, IconTrendStable, IconChevronRight } from '@/lib/icons'

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? 'demo-org-id'

const TIER_COLOR: Record<string, string> = {
  enterprise: 'bg-[#F0EEFF] text-[#6C4EF2]',
  growth:     'bg-[#EEF1FE] text-[#4F6EF7]',
  starter:    'bg-[#F7F8FC] text-[#6B7280]',
  other:      'bg-[#F7F8FC] text-[#6B7280]',
}

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'plans'>('timeline')
  const { account, contacts, isLoading, mutate } = useAccount(id, ORG_ID)
  const { latest: healthRecord, previous } = useHealthScore(id)
  const { summary, isStreaming, generate } = useAccountSummary(id, ORG_ID)

  if (isLoading) return <PageSkeleton />
  if (!account) {
    return (
      <div className="p-6">
        <p className="text-[#9CA3AF]">Cuenta no encontrada.</p>
      </div>
    )
  }

  const renewalDays = daysUntil(account.renewalDate)

  return (
    <div>
      <div>
        {/* Account header card */}
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-[#0F1117] truncate">{account.name}</h1>
              {account.domain && (
                <p className="text-sm text-[#9CA3AF] mt-0.5">{account.domain}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {account.tier && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${TIER_COLOR[account.tier] ?? 'bg-[#EEF1FE] text-[#4F6EF7]'}`}>
                  {account.tier}
                </span>
              )}
              {account.healthScore != null && (() => {
                const s = account.healthScore
                const style = s >= 70 ? 'bg-[#E8FAF0] text-[#22C55E]' : s >= 40 ? 'bg-[#FEF3E8] text-[#F58C37]' : 'bg-[#FEE8E8] text-[#EF4444]'
                return (
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${style}`}>
                    {s}/100
                  </span>
                )
              })()}
              <Link href={`/accounts/${id}/edit`}>
                <button className="h-8 px-3 bg-white border border-[#ECEEF5] text-[#6B7280] rounded-xl text-xs font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors">
                  Editar
                </button>
              </Link>
              <SyncButtons account={account} onSynced={mutate} />
              <MeetingBriefModal account={account} contacts={contacts} />
            </div>
          </div>

          {/* Inline metrics */}
          <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-[#ECEEF5]">
            {account.arr != null && (
              <div>
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">ARR</p>
                <p className="text-sm font-semibold text-[#0F1117] mt-0.5">{formatCurrency(account.arr)}</p>
              </div>
            )}
            {renewalDays !== null && (
              <div>
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Renovación</p>
                <p className={`text-sm font-semibold mt-0.5 ${renewalDays <= 90 ? 'text-[#F58C37]' : 'text-[#0F1117]'}`}>
                  {formatDate(account.renewalDate)} {renewalDays <= 90 && `(${renewalDays}d)`}
                </p>
              </div>
            )}
            {account.healthTrend && (
              <div>
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Tendencia</p>
                <p className={`text-sm font-semibold mt-0.5 ${
                  account.healthTrend === 'improving' ? 'text-[#22C55E]' :
                  account.healthTrend === 'declining' ? 'text-[#EF4444]' :
                  'text-[#6B7280]'
                }`}>
                  {account.healthTrend === 'improving'
                    ? <span className="inline-flex items-center gap-1"><Icon icon={IconTrendUp} size={14} /> Mejorando</span>
                    : account.healthTrend === 'declining'
                      ? <span className="inline-flex items-center gap-1"><Icon icon={IconTrendDown} size={14} /> Declinando</span>
                      : <span className="inline-flex items-center gap-1"><Icon icon={IconTrendStable} size={14} /> Estable</span>
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {!summary && !isStreaming && (
          <div className="mb-6">
            <button
              onClick={generate}
              className="text-xs text-blue-600 hover:underline"
            >
              <span className="inline-flex items-center gap-1">Generar resumen AI <Icon icon={IconChevronRight} size={12} /></span>
            </button>
          </div>
        )}
        {(summary || isStreaming) && (
          <div className="mb-6">
            <AIInsightCard
              title="Resumen ejecutivo"
              content={summary}
              isStreaming={isStreaming}
            />
          </div>
        )}

        <Separator className="my-2" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mt-6">
          {/* Left: Timeline / Tareas tabs */}
          <div>
            <div className="flex gap-1 mb-4">
              {(['timeline', 'tasks', 'plans'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                      : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
                  }`}
                >
                  {tab === 'timeline' ? 'Timeline' : tab === 'tasks' ? 'Tareas' : 'Plans'}
                </button>
              ))}
            </div>
            {activeTab === 'timeline' && <AccountTimeline accountId={id} />}
            {activeTab === 'tasks'    && <TasksSection    accountId={id} />}
            {activeTab === 'plans'    && <PlansSection    accountId={id} />}
          </div>

          {/* Right: Health + Contacts + CSM Notes */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Health Score
              </h2>
              <HealthScoreDetail
                record={
                  healthRecord
                    ? {
                        id: healthRecord.id,
                        accountId: healthRecord.account_id,
                        score: healthRecord.score,
                        signals: healthRecord.signals as never,
                        aiExplanation: healthRecord.ai_explanation,
                        calculatedAt: healthRecord.calculated_at,
                      }
                    : null
                }
                previousScore={previous?.score}
                previousSignals={previous?.signals ?? null}
              />
            </div>

            <Separator />

            <ContactsSection accountId={id} />

            <Separator />

            <CsmNotesSection
              accountId={id}
              orgId={ORG_ID}
              initialNotes={account.csmNotes ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
