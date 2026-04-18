'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Button, Label, TextField, TextArea, Input,
  Select, ListBox, ListBoxItem,
  Chip, Skeleton,
} from '@heroui/react'
import { parseDate, type CalendarDate } from '@internationalized/date'
import { toast } from '@heroui/react'
import { DatePickerField } from '@/components/shared/DatePickerField'
import { Icon } from '@/components/shared/Icon'
import { IconAI, IconBack, IconClose, IconDelete, IconInfo } from '@/lib/icons'
import type { Account } from '@/domain/account/Account'
import type { SuccessPlan } from '@/domain/plan/SuccessPlan'

// ── Types ────────────────────────────────────────────────────────────────────
interface AITask {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  suggested_due_days: number
}
interface AIMilestone {
  title: string
  sort_order: number
  tasks: AITask[]
}
interface AIPlan {
  title: string
  objective: string
  reasoning: string
  milestones: AIMilestone[]
}

interface GeneratePlanAIModalProps {
  accountId: string
  account: Pick<Account, 'name' | 'healthScore' | 'renewalDate'> & {
    contactCount?: number
    eventCount?: number
  }
  onCreated: (plan: SuccessPlan) => void
  onClose: () => void
  onBack: () => void
}

type Step = 'configure' | 'generating' | 'preview'

const PLAN_TYPE_OPTIONS = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'at_risk',    label: 'En riesgo' },
  { id: 'renewal',    label: 'Renovación' },
  { id: 'expansion',  label: 'Expansión' },
]

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  onboarding: { bg: 'bg-[#E8FAF0]', text: 'text-[#22C55E]' },
  at_risk:    { bg: 'bg-[#FEE8E8]', text: 'text-[#EF4444]' },
  renewal:    { bg: 'bg-[#EEF1FE]', text: 'text-[#4F6EF7]' },
  expansion:  { bg: 'bg-[#F0EEFF]', text: 'text-[#6C4EF2]' },
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  high:   { bg: 'bg-[#FEE8E8]', text: 'text-[#EF4444]' },
  medium: { bg: 'bg-[#FEF3E8]', text: 'text-[#F58C37]' },
  low:    { bg: 'bg-[#F7F8FC]', text: 'text-[#6B7280]' },
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta', medium: 'Media', low: 'Baja',
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// ── Component ────────────────────────────────────────────────────────────────
export function GeneratePlanAIModal({
  accountId,
  account,
  onCreated,
  onClose,
  onBack,
}: GeneratePlanAIModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Step state
  const [step, setStep] = useState<Step>('configure')

  // Configure step
  const [planType, setPlanType] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')

  // Preview step
  const [plan, setPlan] = useState<AIPlan | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editObjective, setEditObjective] = useState('')
  const [editMilestones, setEditMilestones] = useState<AIMilestone[]>([])
  const [startDate, setStartDate] = useState<CalendarDate | null>(() => {
    try { return parseDate(todayStr()) } catch { return null }
  })
  const [targetDate, setTargetDate] = useState<CalendarDate | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Generate ─────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!planType) return
    setStep('generating')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          templateType: planType,
          additionalContext: additionalContext.trim() || undefined,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
        toast.danger(err.error ?? 'Error al generar el plan')
        setStep('configure')
        return
      }

      const data = await res.json() as AIPlan
      setPlan(data)
      setEditTitle(data.title)
      setEditObjective(data.objective)
      setEditMilestones(data.milestones)

      // Calculate target date from max suggested_due_days
      const maxDays = Math.max(
        ...data.milestones.flatMap(m => m.tasks.map(t => t.suggested_due_days)),
        30
      )
      try {
        const d = new Date()
        d.setDate(d.getDate() + maxDays)
        setTargetDate(parseDate(d.toISOString().split('T')[0]))
      } catch { /* keep null */ }

      setStep('preview')
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStep('configure')
        return
      }
      toast.danger('Error de conexión')
      setStep('configure')
    }
  }, [accountId, planType, additionalContext])

  // ── Remove milestone / task ──────────────────────────────────────
  function removeMilestone(idx: number) {
    setEditMilestones(prev => prev.filter((_, i) => i !== idx))
  }
  function removeTask(msIdx: number, taskIdx: number) {
    setEditMilestones(prev => prev.map((ms, i) =>
      i === msIdx ? { ...ms, tasks: ms.tasks.filter((_, j) => j !== taskIdx) } : ms
    ))
  }

  // ── Save (reuse existing flow) ───────────────────────────────────
  async function handleSave() {
    if (editMilestones.length === 0) return
    setSaving(true)

    try {
      // 1. Create plan
      const planRes = await fetch(`/api/accounts/${accountId}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          objective: editObjective.trim() || null,
          templateType: planType,
          startDate: startDate?.toString() ?? null,
          targetDate: targetDate?.toString() ?? null,
          useTemplate: false,
        }),
      })
      if (!planRes.ok) { toast.danger('Error al crear el plan'); setSaving(false); return }
      const { plan: createdPlan } = await planRes.json() as { plan: SuccessPlan }

      // 2. Create milestones + tasks sequentially
      for (let i = 0; i < editMilestones.length; i++) {
        const ms = editMilestones[i]

        const msRes = await fetch(`/api/plans/${createdPlan.id}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: ms.title, sortOrder: i }),
        })
        if (!msRes.ok) continue
        const { milestone } = await msRes.json() as { milestone: { id: string } }

        for (const task of ms.tasks) {
          const dueDate = startDate
            ? (() => { const d = new Date(startDate.toString()); d.setDate(d.getDate() + task.suggested_due_days); return d.toISOString().split('T')[0] })()
            : null

          await fetch(`/api/accounts/${accountId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId,
              title: task.title,
              description: task.description || null,
              priority: task.priority,
              dueDate,
              planId: createdPlan.id,
              milestoneId: milestone.id,
            }),
          })
        }
      }

      toast.success('Plan creado con AI')
      onCreated(createdPlan)
    } catch {
      toast.danger('Error al guardar el plan')
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────
  const isWide = step === 'preview'

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={`bg-white rounded-[14px] border border-[#ECEEF5] w-full transition-[max-width] duration-200 max-h-[90vh] flex flex-col ${isWide ? 'max-w-3xl' : 'max-w-lg'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEEF5] flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 'configure' && (
              <Button isIconOnly variant="ghost" size="sm" onPress={onBack} className="text-[#9CA3AF] hover:text-[#4F6EF7] min-w-0 w-6 h-6">
                <Icon icon={IconBack} size={14} />
              </Button>
            )}
            <div className="w-6 h-6 rounded-md bg-[#EEF1FE] flex items-center justify-center">
              <Icon icon={IconAI} size={14} className="text-[#4F6EF7]" />
            </div>
            <h2 className="text-sm font-semibold text-[#0F1117]">
              {step === 'configure' ? 'Generar plan con AI' : step === 'generating' ? 'Generando...' : 'Plan generado'}
            </h2>
          </div>
          <Button isIconOnly variant="ghost" size="sm" onPress={onClose} className="w-7 h-7 min-w-0 text-[#9CA3AF] hover:text-[#6B7280]">
            <Icon icon={IconClose} size={14} />
          </Button>
        </div>

        {/* ── Step: Configure ──────────────────────────────────────── */}
        {step === 'configure' && (
          <div className="p-5 space-y-4 overflow-y-auto">
            <Select.Root
              selectedKey={planType || null}
              onSelectionChange={key => setPlanType((key as string) ?? '')}
              className="w-full"
            >
              <Label className="block text-sm font-medium text-[#0F1117] mb-1">Tipo de plan</Label>
              <Select.Trigger className="w-full flex items-center justify-between border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm bg-white hover:border-[#4F6EF7]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]">
                <Select.Value>{({ isPlaceholder }: { isPlaceholder: boolean }) => isPlaceholder ? 'Seleccionar tipo' : undefined}</Select.Value>
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {PLAN_TYPE_OPTIONS.map(o => (
                    <ListBoxItem key={o.id} id={o.id}>{o.label}</ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select.Root>

            <TextField value={additionalContext} onChange={setAdditionalContext} className="w-full">
              <Label className="block text-sm font-medium text-[#0F1117] mb-1">Contexto adicional</Label>
              <TextArea
                placeholder="Ej: El cliente mencionó que está evaluando competidores, enfocarse en demostrar valor rápido..."
                rows={3}
                className="w-full px-3 py-2 border border-[#ECEEF5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] resize-none placeholder:text-[#9CA3AF]"
              />
            </TextField>

            {/* Context info card */}
            <div className="bg-[#F7F8FC] border border-[#ECEEF5] rounded-[14px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon={IconInfo} size={14} className="text-[#9CA3AF]" />
                <span className="text-xs font-medium text-[#6B7280]">Se analizará el contexto de la cuenta</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#9CA3AF]">
                {account.contactCount != null && <span>{account.contactCount} contactos</span>}
                {account.eventCount != null && <span>{account.eventCount} eventos recientes</span>}
                {account.healthScore != null && <span>Health Score: {account.healthScore}/100</span>}
                {account.renewalDate && <span>Renovación: {account.renewalDate.slice(0, 10)}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onPress={onClose} className="h-9 px-4 border border-[#ECEEF5] text-[#6B7280] rounded-xl text-sm font-medium">
                Cancelar
              </Button>
              <Button
                isDisabled={!planType}
                onPress={handleGenerate}
                className={`h-9 px-4 rounded-xl text-sm font-medium text-white transition-colors ${planType ? 'bg-[#4F6EF7] hover:bg-[#3D5BD9]' : 'bg-[#4F6EF7]/50 cursor-not-allowed'}`}
              >
                Generar plan
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Generating ─────────────────────────────────────── */}
        {step === 'generating' && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[#6B7280] animate-pulse">Analizando contexto de {account.name}...</p>
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-[#ECEEF5] rounded-[14px] p-4 space-y-2">
                <Skeleton className="h-4 w-1/3 rounded-lg" />
                <Skeleton className="h-3 w-full rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
                <Skeleton className="h-3 w-2/3 rounded-lg" />
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onPress={() => { abortRef.current?.abort(); setStep('configure') }}
                className="h-9 px-4 border border-[#ECEEF5] text-[#6B7280] rounded-xl text-sm font-medium"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Preview ────────────────────────────────────────── */}
        {step === 'preview' && plan && (
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Title + type chip */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <TextField value={editTitle} onChange={setEditTitle} className="w-full">
                  <Input className="w-full text-base font-semibold text-[#0F1117] border border-[#ECEEF5] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]" />
                </TextField>
              </div>
              {planType && TYPE_COLORS[planType] && (
                <Chip variant="soft" className={`${TYPE_COLORS[planType].bg} ${TYPE_COLORS[planType].text} flex-shrink-0 mt-1`}>
                  <Chip.Label className="text-[11px] font-semibold">{PLAN_TYPE_OPTIONS.find(o => o.id === planType)?.label}</Chip.Label>
                </Chip>
              )}
            </div>

            {/* Objective */}
            <TextField value={editObjective} onChange={setEditObjective} className="w-full">
              <Label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Objetivo</Label>
              <TextArea
                rows={2}
                className="w-full px-3 py-2 border border-[#ECEEF5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] resize-none"
              />
            </TextField>

            {/* Reasoning (collapsible) */}
            <div className="bg-[#F7F8FC] border border-[#ECEEF5] rounded-[14px] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left"
              >
                <Icon icon={IconInfo} size={14} className="text-[#9CA3AF]" />
                <span className="text-xs font-medium text-[#6B7280] flex-1">Por qué este plan</span>
                <svg className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${showReasoning ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showReasoning && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-[#6B7280] leading-relaxed">{plan.reasoning}</p>
                </div>
              )}
            </div>

            {/* Milestones */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Milestones ({editMilestones.length})</p>
              {editMilestones.map((ms, msIdx) => (
                <div key={msIdx} className="bg-white border border-[#ECEEF5] rounded-[14px] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-[#0F1117]">{ms.title}</p>
                    <Button
                      isIconOnly variant="ghost" size="sm"
                      onPress={() => removeMilestone(msIdx)}
                      className="w-6 h-6 min-w-0 text-[#9CA3AF] hover:text-[#EF4444]"
                    >
                      <Icon icon={IconClose} size={12} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {ms.tasks.map((task, taskIdx) => {
                      const pc = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium
                      return (
                        <div key={taskIdx} className="flex items-start gap-2 py-1.5 border-t border-[#ECEEF5] first:border-0 first:pt-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#0F1117]">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${pc.bg} ${pc.text}`}>
                                {PRIORITY_LABELS[task.priority]}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF]">
                                Vence en {task.suggested_due_days}d
                              </span>
                            </div>
                          </div>
                          <Button
                            isIconOnly variant="ghost" size="sm"
                            onPress={() => removeTask(msIdx, taskIdx)}
                            className="w-5 h-5 min-w-0 text-[#9CA3AF] hover:text-[#EF4444] flex-shrink-0 mt-0.5"
                          >
                            <Icon icon={IconDelete} size={10} />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <DatePickerField
                label="Fecha inicio"
                value={startDate}
                onChange={(d) => setStartDate((d ?? null) as CalendarDate | null)}
              />
              <DatePickerField
                label="Fecha objetivo"
                value={targetDate}
                onChange={(d) => setTargetDate((d ?? null) as CalendarDate | null)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2 border-t border-[#ECEEF5]">
              <Button variant="ghost" onPress={onClose} className="h-9 px-4 text-[#6B7280] rounded-xl text-sm font-medium">
                Descartar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onPress={() => { setStep('configure') }}
                  className="h-9 px-4 border border-[#ECEEF5] text-[#6B7280] rounded-xl text-sm font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7]"
                >
                  Regenerar
                </Button>
                <Button
                  onPress={handleSave}
                  isDisabled={saving || editMilestones.length === 0}
                  className={`h-9 px-5 rounded-xl text-sm font-medium text-white transition-colors ${
                    !saving && editMilestones.length > 0
                      ? 'bg-[#4F6EF7] hover:bg-[#3D5BD9]'
                      : 'bg-[#4F6EF7]/50 cursor-not-allowed'
                  }`}
                >
                  {saving ? 'Creando...' : 'Crear plan'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
