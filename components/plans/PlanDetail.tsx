'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, TextField, Input } from '@heroui/react'
import type { SuccessPlan, PlanMilestone } from '@/domain/plan/SuccessPlan'
import type { AccountTask, TaskPriority } from '@/domain/task/AccountTask'
import { formatDate } from '@/lib/utils/date'

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  urgent: { label: 'Urgente', className: 'bg-[#FEE8E8] text-[#EF4444]' },
  high:   { label: 'Alta',    className: 'bg-[#FEF3E8] text-[#F58C37]' },
  medium: { label: 'Media',   className: 'bg-[#EEF1FE] text-[#4F6EF7]' },
  low:    { label: 'Baja',    className: 'bg-[#F7F8FC] text-[#6B7280]' },
}

interface MilestoneWithTasks extends PlanMilestone {
  tasks: AccountTask[]
}

interface PlanDetailProps {
  plan:          SuccessPlan
  accountId:     string
  onPlanUpdated: (plan: SuccessPlan) => void
}

function MilestoneRow({
  milestone,
  accountId,
  planId,
  onMilestoneUpdated,
  onTaskChanged,
}: {
  milestone:          MilestoneWithTasks
  accountId:          string
  planId:             string
  onMilestoneUpdated: (ms: MilestoneWithTasks) => void
  onTaskChanged:      () => void
}) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [newTitle,   setNewTitle]   = useState('')
  const [savingTask, setSavingTask] = useState(false)

  async function toggleMilestone() {
    const res = await fetch(`/api/plans/milestones/${milestone.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isCompleted: !milestone.isCompleted }),
    })
    if (!res.ok) return
    const { milestone: updated } = await res.json()
    onMilestoneUpdated({ ...milestone, ...updated })
  }

  async function toggleTask(task: AccountTask) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const res = await fetch(`/api/tasks/${task.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) return
    onTaskChanged()
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setSavingTask(true)
    const res = await fetch(`/api/accounts/${accountId}/tasks`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        title:       newTitle.trim(),
        planId,
        milestoneId: milestone.id,
      }),
    })
    setSavingTask(false)
    if (!res.ok) return
    setNewTitle('')
    setAddingTask(false)
    onTaskChanged()
  }

  const done  = milestone.tasks.filter(t => t.status === 'completed').length
  const total = milestone.tasks.length

  return (
    <div className="border border-[#ECEEF5] rounded-xl overflow-hidden">
      {/* Milestone header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-[#F7F8FC] cursor-pointer"
        onClick={() => setCollapsed(c => !c)}
      >
        {/* Milestone checkbox */}
        <Button
          isIconOnly
          size="sm"
         
          onPress={() => { toggleMilestone() }}
          className={`w-5 h-5 min-w-0 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            milestone.isCompleted ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[#D1D5DB] hover:border-[#22C55E] bg-transparent'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {milestone.isCompleted && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${milestone.isCompleted ? 'line-through text-[#9CA3AF]' : 'text-[#0F1117]'}`}>
            {milestone.title}
          </p>
        </div>

        <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">{done}/{total}</span>
        <svg
          className={`w-4 h-4 text-[#9CA3AF] flex-shrink-0 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Tasks */}
      {!collapsed && (
        <div className="px-4 py-3 space-y-2">
          {milestone.tasks.map(task => {
            const isCompleted = task.status === 'completed'
            const prio = PRIORITY_CONFIG[task.priority as TaskPriority] ?? PRIORITY_CONFIG.medium
            return (
              <div key={task.id} className="flex items-center gap-2.5">
                <Button
                  isIconOnly
                  size="sm"
                 
                  onPress={() => toggleTask(task)}
                  className={`w-4 h-4 min-w-0 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    isCompleted ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[#D1D5DB] hover:border-[#4F6EF7] bg-transparent'
                  }`}
                >
                  {isCompleted && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </Button>
                <p className={`flex-1 text-sm ${isCompleted ? 'line-through text-[#9CA3AF]' : 'text-[#0F1117]'}`}>
                  {task.title}
                </p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 ${prio.className}`}>
                  {prio.label}
                </span>
                {task.dueDate && (
                  <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">{formatDate(task.dueDate)}</span>
                )}
              </div>
            )
          })}

          {milestone.tasks.length === 0 && (
            <p className="text-xs text-[#9CA3AF] text-center py-1">Sin tareas</p>
          )}

          {/* Add task inline */}
          {addingTask ? (
            <div className="flex gap-2 mt-1">
              <TextField value={newTitle} onChange={setNewTitle} className="flex-1">
                <Input
                  placeholder="Título de la tarea"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') addTask()
                    if (e.key === 'Escape') { setAddingTask(false); setNewTitle('') }
                  }}
                  className="flex-1 h-8 px-2.5 border border-[#ECEEF5] rounded-lg text-sm text-[#0F1117] bg-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#9CA3AF]"
                />
              </TextField>
              <Button
                size="sm"
               
                onPress={addTask}
                isDisabled={savingTask || !newTitle.trim()}
                className="h-8 px-3 bg-[#4F6EF7] text-white rounded-lg text-xs font-medium hover:bg-[#4060E8] transition-colors disabled:opacity-40 min-w-0"
              >
                Añadir
              </Button>
              <Button
                size="sm"
               
                onPress={() => { setAddingTask(false); setNewTitle('') }}
                className="h-8 px-2 border border-[#ECEEF5] text-[#6B7280] rounded-lg text-xs hover:bg-[#F7F8FC] transition-colors min-w-0"
              >
                ×
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
             
              onPress={() => { setAddingTask(true) }}
              className="text-xs text-[#9CA3AF] hover:text-[#4F6EF7] transition-colors mt-1 p-0 h-auto min-w-0"
            >
              + Tarea
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function PlanDetail({ plan, accountId, onPlanUpdated }: PlanDetailProps) {
  const [milestones, setMilestones] = useState<MilestoneWithTasks[]>([])
  const [loading,    setLoading]    = useState(true)

  const fetchDetail = useCallback(async () => {
    const res  = await fetch(`/api/plans/${plan.id}`)
    const data = await res.json()
    setMilestones(data.milestones ?? [])
    setLoading(false)
  }, [plan.id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res  = await fetch(`/api/plans/${plan.id}`)
      const data = await res.json()
      if (!cancelled) { setMilestones(data.milestones ?? []); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [plan.id])

  async function handleTaskChanged() {
    const [planRes, detailRes] = await Promise.all([
      fetch(`/api/plans/${plan.id}`),
      fetchDetail(),
    ])
    if (planRes.ok) {
      const data = await planRes.json()
      if (data.plan) onPlanUpdated(data.plan)
    }
    void detailRes
  }

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-[#F7F8FC] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="border-t border-[#ECEEF5] bg-[#F7F8FC]/50 p-4 space-y-2">
      {plan.objective && (
        <p className="text-xs text-[#6B7280] px-1 mb-3">
          <span className="font-semibold text-[#9CA3AF]">Objetivo:</span> {plan.objective}
        </p>
      )}

      {milestones.length === 0 ? (
        <p className="text-xs text-[#9CA3AF] text-center py-4">Sin milestones. Añade uno para estructurar el plan.</p>
      ) : (
        milestones.map(ms => (
          <MilestoneRow
            key={ms.id}
            milestone={ms}
            accountId={accountId}
            planId={plan.id}
            onMilestoneUpdated={updated => setMilestones(prev => prev.map(m => m.id === updated.id ? { ...updated, tasks: m.tasks } : m))}
            onTaskChanged={handleTaskChanged}
          />
        ))
      )}
    </div>
  )
}
