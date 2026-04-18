'use client'

import { useState, useRef } from 'react'
import { Button, TextField, Input, TextArea, Label } from '@heroui/react'
import { parseDate, type CalendarDate } from '@internationalized/date'
import { DatePickerField } from '@/components/shared/DatePickerField'
import { Icon } from '@/components/shared/Icon'
import { IconAI } from '@/lib/icons'
import type { SuccessPlan, PlanTemplateType } from '@/domain/plan/SuccessPlan'
import type { Account } from '@/domain/account/Account'
import { PLAN_TEMPLATES } from '@/lib/plans/templates'
import { GeneratePlanAIModal } from '@/components/plans/GeneratePlanAIModal'

const TEMPLATE_CONFIG: Record<PlanTemplateType, { label: string; color: string; bgColor: string }> = {
  onboarding: { label: 'Onboarding',    color: 'text-[#22C55E]', bgColor: 'bg-[#E8FAF0]' },
  at_risk:    { label: 'En riesgo',     color: 'text-[#EF4444]', bgColor: 'bg-[#FEE8E8]' },
  renewal:    { label: 'Renovación',    color: 'text-[#4F6EF7]', bgColor: 'bg-[#EEF1FE]' },
  expansion:  { label: 'Expansión',     color: 'text-[#6C4EF2]', bgColor: 'bg-[#F0EEFF]' },
  custom:     { label: 'Personalizado', color: 'text-[#6B7280]', bgColor: 'bg-[#F7F8FC]' },
}

interface NewPlanModalProps {
  accountId: string
  account?: Pick<Account, 'name' | 'healthScore' | 'renewalDate'> & {
    contactCount?: number
    eventCount?: number
  }
  onCreated: (plan: SuccessPlan) => void
  onClose: () => void
}

export function NewPlanModal({ accountId, account, onCreated, onClose }: NewPlanModalProps) {
  const overlayRef  = useRef<HTMLDivElement>(null)
  const [step,         setStep]         = useState<'template' | 'details'>('template')
  const [showAIModal,  setShowAIModal]  = useState(false)
  const [templateType, setTemplateType] = useState<PlanTemplateType | null>(null)
  const [title,        setTitle]        = useState('')
  const [objective,    setObjective]    = useState('')
  const [startDate,    setStartDate]    = useState<CalendarDate | null>(() => {
    try { return parseDate(new Date().toISOString().split('T')[0]) } catch { return null }
  })
  const [targetDate,   setTargetDate]   = useState<CalendarDate | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  function handleTemplateSelect(type: PlanTemplateType) {
    setTemplateType(type)
    const tmpl = PLAN_TEMPLATES.find(t => t.type === type)
    if (tmpl) {
      setObjective(tmpl.objective)
      const d = new Date()
      d.setDate(d.getDate() + tmpl.daysTarget)
      try { setTargetDate(parseDate(d.toISOString().split('T')[0])) } catch { setTargetDate(null) }
    } else {
      setObjective('')
      setTargetDate(null)
    }
    setStep('details')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El título es requerido'); return }
    setSaving(true); setError('')

    const res = await fetch(`/api/accounts/${accountId}/plans`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        title:        title.trim(),
        objective:    objective.trim() || null,
        templateType: templateType ?? 'custom',
        startDate:    startDate?.toString() ?? null,
        targetDate:   targetDate?.toString() ?? null,
        useTemplate:  templateType !== null && templateType !== 'custom',
      }),
    })

    if (!res.ok) { setError('Error al crear el plan'); setSaving(false); return }
    const data = await res.json()
    onCreated(data.plan)
  }

  const inputClass = 'w-full h-9 px-3 border border-[#ECEEF5] rounded-lg text-sm text-[#0F1117] bg-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#9CA3AF]'

  if (showAIModal && account) {
    return (
      <GeneratePlanAIModal
        accountId={accountId}
        account={account}
        onCreated={onCreated}
        onClose={onClose}
        onBack={() => setShowAIModal(false)}
      />
    )
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-[14px] border border-[#ECEEF5] w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEEF5]">
          <div className="flex items-center gap-2">
            {step === 'details' && (
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setStep('template')}
                className="text-[#9CA3AF] hover:text-[#4F6EF7] transition-colors min-w-0 w-6 h-6"
              >
                ←
              </Button>
            )}
            <h2 className="text-sm font-semibold text-[#0F1117]">
              {step === 'template' ? 'Seleccionar template' : 'Nuevo plan'}
            </h2>
          </div>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={onClose}
            className="w-7 h-7 min-w-0 text-[#9CA3AF] hover:text-[#6B7280]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {step === 'template' ? (
          <div className="p-5 space-y-2">
            {/* AI Generation card */}
            {account && (
              <Button
                onPress={() => setShowAIModal(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#4F6EF7]/30 bg-white hover:bg-[#F7F8FC] hover:border-[#4F6EF7]/60 transition-colors text-left h-auto justify-start"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF1FE] flex items-center justify-center flex-shrink-0">
                  <Icon icon={IconAI} size={16} className="text-[#4F6EF7]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F1117]">Generar con AI</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Claude analiza la cuenta y genera un plan personalizado</p>
                </div>
              </Button>
            )}

            {([...PLAN_TEMPLATES, null] as (typeof PLAN_TEMPLATES[number] | null)[]).map((tmpl, i) => {
              if (tmpl === null) {
                const cfg = TEMPLATE_CONFIG.custom
                return (
                  <Button
                    key="custom"
                   
                    onPress={() => handleTemplateSelect('custom')}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-[#ECEEF5] bg-white hover:border-[#4F6EF7] hover:bg-[#F7F8FC] transition-colors text-left h-auto justify-start"
                  >
                    <span className={`text-[10px] font-semibold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#0F1117]">Plan personalizado</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Empieza desde cero</p>
                    </div>
                  </Button>
                )
              }
              const cfg = TEMPLATE_CONFIG[tmpl.type]
              return (
                <Button
                  key={i}
                 
                  onPress={() => handleTemplateSelect(tmpl.type)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-[#ECEEF5] bg-white hover:border-[#4F6EF7] hover:bg-[#F7F8FC] transition-colors text-left h-auto justify-start"
                >
                  <span className={`text-[10px] font-semibold flex-shrink-0 mt-0.5 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F1117]">{tmpl.label}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{tmpl.objective}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">
                      {tmpl.milestones.length} milestones · {tmpl.milestones.reduce((s, m) => s + m.tasks.length, 0)} tareas · {tmpl.daysTarget} días
                    </p>
                  </div>
                </Button>
              )
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {templateType && templateType !== 'custom' && (
              <div className="flex items-center gap-2 p-3 bg-[#F7F8FC] rounded-xl border border-[#ECEEF5]">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${TEMPLATE_CONFIG[templateType].bgColor} ${TEMPLATE_CONFIG[templateType].color}`}>
                  {TEMPLATE_CONFIG[templateType].label}
                </span>
                <p className="text-xs text-[#6B7280]">
                  Se crearán {PLAN_TEMPLATES.find(t => t.type === templateType)?.milestones.length} milestones y {PLAN_TEMPLATES.find(t => t.type === templateType)?.milestones.reduce((s, m) => s + m.tasks.length, 0)} tareas automáticamente
                </p>
              </div>
            )}

            <TextField value={title} onChange={setTitle} isRequired className="w-full">
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Título *</Label>
              <Input
                placeholder={templateType === 'onboarding' ? 'Onboarding Empresa XYZ' : 'Nombre del plan'}
                autoFocus
                className={inputClass}
              />
            </TextField>

            <TextField value={objective} onChange={setObjective} className="w-full">
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Objetivo</Label>
              <TextArea
                placeholder="¿Qué resultado queremos lograr?"
                rows={2}
                className="w-full px-3 py-2 border border-[#ECEEF5] rounded-lg text-sm text-[#0F1117] bg-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#9CA3AF] resize-none"
              />
            </TextField>

            <div className="grid grid-cols-2 gap-3">
              <DatePickerField
                label="Fecha inicio"
                value={startDate}
                onChange={(date) => setStartDate((date ?? null) as CalendarDate | null)}
              />
              <DatePickerField
                label="Fecha objetivo"
                value={targetDate}
                onChange={(date) => setTargetDate((date ?? null) as CalendarDate | null)}
              />
            </div>

            {error && <p className="text-xs text-[#EF4444]">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onPress={onClose}
                className="h-9 px-4 border border-[#ECEEF5] text-[#6B7280] rounded-xl text-sm font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isDisabled={saving}
                className="h-9 px-4 bg-[#4F6EF7] text-white rounded-xl text-sm font-medium hover:bg-[#4060E8] transition-colors disabled:opacity-50"
              >
                {saving ? 'Creando…' : 'Crear plan'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
