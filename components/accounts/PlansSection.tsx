'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SuccessPlan } from '@/domain/plan/SuccessPlan'
import { Icon } from '@/components/shared/Icon'
import { IconChevronRight } from '@/lib/icons'
import { PlanCard } from '@/components/plans/PlanCard'
import { PlanDetail } from '@/components/plans/PlanDetail'
import { NewPlanModal } from '@/components/plans/NewPlanModal'

interface PlansSectionProps {
  accountId: string
}

export function PlansSection({ accountId }: PlansSectionProps) {
  const [plans,     setPlans]     = useState<SuccessPlan[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const fetchPlans = useCallback(async () => {
    try {
      const res  = await fetch(`/api/accounts/${accountId}/plans`)
      const data = await res.json()
      setPlans(data.plans ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  function handleCreated(plan: SuccessPlan) {
    setPlans(prev => [plan, ...prev])
    setShowModal(false)
    setExpanded(plan.id)
  }

  function handlePlanUpdated(updated: SuccessPlan) {
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0F1117]">Success Plans</h2>
          {plans.length > 0 && (
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              {plans.filter(p => p.status === 'active').length} activo{plans.filter(p => p.status === 'active').length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-7 px-2.5 bg-[#4F6EF7] text-white rounded-lg text-xs font-medium hover:bg-[#4060E8] transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo plan
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-[#F7F8FC] rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-[#ECEEF5] rounded-[14px]">
          <p className="text-xs text-[#9CA3AF] mb-2">Sin planes activos</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-[#4F6EF7] hover:underline"
          >
            <span className="inline-flex items-center gap-1">Crear primer plan <Icon icon={IconChevronRight} size={12} /></span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <div key={plan.id}>
              <PlanCard
                plan={plan}
                isExpanded={expanded === plan.id}
                onToggle={() => setExpanded(expanded === plan.id ? null : plan.id)}
              />
              {expanded === plan.id && (
                <PlanDetail
                  plan={plan}
                  accountId={accountId}
                  onPlanUpdated={handlePlanUpdated}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewPlanModal
          accountId={accountId}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
