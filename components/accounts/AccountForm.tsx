'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button, Label,
  TextField, Input,
  NumberField,
  TextArea,
  Select, ListBox, ListBoxItem,
  Chip,
} from '@heroui/react'
import { toast } from '@heroui/react'
import type { DateValue } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import { DatePickerField } from '@/components/shared/DatePickerField'
import { Icon } from '@/components/shared/Icon'
import {
  IconCompany, IconContract, IconAssignment, IconNote,
  IconBack,
} from '@/lib/icons'
import type { Account } from '@/domain/account/Account'
import { useUsers } from '@/hooks/useUsers'
import { formatCurrency } from '@/lib/utils/format'

const TIER_OPTIONS = [
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'growth',     label: 'Growth' },
  { id: 'starter',    label: 'Starter' },
  { id: 'other',      label: 'Otro' },
]
const INDUSTRY_OPTIONS = [
  { id: 'saas',       label: 'SaaS' },
  { id: 'fintech',    label: 'Fintech' },
  { id: 'ecommerce',  label: 'eCommerce' },
  { id: 'healthtech', label: 'Healthtech' },
  { id: 'other',      label: 'Otro' },
]

interface AccountFormProps {
  account?: Account
  onSuccess?: (account: Account) => void
}

function safeParseDate(str: string | null | undefined): DateValue | null {
  if (!str) return null
  try { return parseDate(str.slice(0, 10)) } catch { return null }
}

const inputClass = 'w-full border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]'

// ── SelectField ───────────────────────────────────────────────────────────────
function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <Select.Root
      selectedKey={value || null}
      onSelectionChange={key => onChange((key as string) ?? '')}
      className="w-full"
    >
      <Label className="block text-sm font-medium text-[#0F1117] mb-1">{label}</Label>
      <Select.Trigger className="w-full flex items-center justify-between border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm bg-white hover:border-[#4F6EF7]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]">
        <Select.Value>{({ isPlaceholder }: { isPlaceholder: boolean }) => isPlaceholder ? placeholder : undefined}</Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map(o => (
            <ListBoxItem key={o.id} id={o.id}>{o.label}</ListBoxItem>
          ))}
        </ListBox>
      </Select.Popover>
    </Select.Root>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.FC<React.SVGProps<SVGSVGElement>>; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-7 h-7 rounded-lg bg-[#EEF1FE] flex items-center justify-center flex-shrink-0">
        <Icon icon={icon} size={16} className="text-[#4F6EF7]" />
      </div>
      <h2 className="text-sm font-semibold text-[#0F1117]">{title}</h2>
    </div>
  )
}

// ── Renewal chip ──────────────────────────────────────────────────────────────
function RenewalChip({ renewalDate }: { renewalDate: DateValue | null }) {
  if (!renewalDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const renewal = new Date(renewalDate.toString() + 'T00:00:00')
  const days = Math.round((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (days < 0) return (
    <Chip color="danger" variant="soft" className="bg-[#FEE8E8] text-[#EF4444]">
      <Chip.Label className="text-[11px] font-semibold">Vencida hace {Math.abs(days)}d</Chip.Label>
    </Chip>
  )
  if (days <= 30) return (
    <Chip color="danger" variant="soft" className="bg-[#FEE8E8] text-[#EF4444]">
      <Chip.Label className="text-[11px] font-semibold">{days}d para renovar</Chip.Label>
    </Chip>
  )
  if (days <= 90) return (
    <Chip color="warning" variant="soft" className="bg-[#FEF3E8] text-[#F58C37]">
      <Chip.Label className="text-[11px] font-semibold">{days}d para renovar</Chip.Label>
    </Chip>
  )
  return (
    <Chip color="success" variant="soft" className="bg-[#E8FAF0] text-[#22C55E]">
      <Chip.Label className="text-[11px] font-semibold">{days}d para renovar</Chip.Label>
    </Chip>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const router    = useRouter()
  const { users } = useUsers()
  const isEdit    = !!account

  const [name,          setName]         = useState(account?.name ?? '')
  const [domain,        setDomain]       = useState(account?.domain ?? '')
  const [tier,          setTier]         = useState(account?.tier ?? '')
  const [industry,      setIndustry]     = useState(account?.industry ?? '')
  const [arr,           setArr]          = useState<number | undefined>(account?.arr ?? undefined)
  const [renewalDate,   setRenewalDate]  = useState<DateValue | null>(safeParseDate(account?.renewalDate))
  const [contractStart, setContractStart]= useState<DateValue | null>(safeParseDate(account?.contractStartDate))
  const [csmId,         setCsmId]        = useState(account?.csmId ?? '')
  const [csmNotes,      setCsmNotes]     = useState(account?.csmNotes ?? '')
  const [isSubmitting,  setIsSubmitting] = useState(false)

  const mrrComputed = arr ? Math.round(arr / 12) : null

  const isDirty = useMemo(() => {
    if (!isEdit) return name.trim().length > 0
    return (
      name !== (account?.name ?? '') ||
      domain !== (account?.domain ?? '') ||
      tier !== (account?.tier ?? '') ||
      industry !== (account?.industry ?? '') ||
      arr !== (account?.arr ?? undefined) ||
      renewalDate?.toString() !== (safeParseDate(account?.renewalDate)?.toString() ?? undefined) ||
      contractStart?.toString() !== (safeParseDate(account?.contractStartDate)?.toString() ?? undefined) ||
      csmId !== (account?.csmId ?? '') ||
      csmNotes !== (account?.csmNotes ?? '')
    )
  }, [isEdit, account, name, domain, tier, industry, arr, renewalDate, contractStart, csmId, csmNotes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)

    const body = {
      name:              name.trim(),
      domain:            domain || null,
      tier:              tier || null,
      industry:          industry || null,
      arr:               arr ?? null,
      mrr:               arr ? Math.round(arr / 12) : null,
      renewalDate:       renewalDate?.toString() ?? null,
      contractStartDate: contractStart?.toString() ?? null,
      csmId:             csmId || null,
      csmNotes:          csmNotes || null,
    }

    const url    = isEdit ? `/api/accounts/${account!.id}` : '/api/accounts'
    const method = isEdit ? 'PATCH' : 'POST'

    try {
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!res.ok) {
        toast.danger(data.error?.fieldErrors?.name?.[0] ?? 'Error al guardar la cuenta')
        setIsSubmitting(false)
        return
      }

      toast.success(isEdit ? 'Cuenta actualizada' : 'Cuenta creada')

      if (onSuccess) onSuccess(data)
      else router.push(`/accounts/${data.id}`)
    } catch {
      toast.danger('Error de conexión')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#F7F8FC] pb-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              isIconOnly
              onPress={() => router.back()}
              className="w-8 h-8 min-w-0 rounded-xl text-[#9CA3AF] hover:text-[#0F1117] hover:bg-[#ECEEF5]"
            >
              <Icon icon={IconBack} size={16} />
            </Button>
            <h1 className="text-lg font-semibold text-[#0F1117]">
              {isEdit ? account!.name : 'Nueva cuenta'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onPress={() => router.back()}
              isDisabled={isSubmitting}
              className="h-9 px-4 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#ECEEF5]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="account-form"
              variant="primary"
              isDisabled={!isDirty || isSubmitting || !name.trim()}
              className={`h-9 px-5 rounded-xl text-sm font-medium text-white transition-colors ${
                isDirty && name.trim() && !isSubmitting
                  ? 'bg-[#4F6EF7] hover:bg-[#3D5BD9]'
                  : 'bg-[#4F6EF7]/50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </div>
        </div>
      </div>

      <form id="account-form" onSubmit={handleSubmit} className="space-y-4">

        {/* ── Card 1: Información básica ─────────────────────────────── */}
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-6 max-md:p-4">
          <SectionHeader icon={IconCompany} title="Información básica" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <TextField value={name} onChange={setName} isRequired className="w-full">
                <Label className="block text-sm font-medium text-[#0F1117] mb-1">
                  Nombre de la cuenta <span className="text-[#EF4444]">*</span>
                </Label>
                <Input
                  placeholder="Acme Corp"
                  className={`${inputClass} text-base font-medium`}
                />
              </TextField>
            </div>

            <TextField value={domain} onChange={setDomain} className="w-full">
              <Label className="block text-sm font-medium text-[#0F1117] mb-1">Dominio</Label>
              <Input placeholder="acme.com" className={inputClass} />
            </TextField>

            <SelectField
              label="Industria"
              placeholder="Seleccionar industria"
              value={industry}
              onChange={setIndustry}
              options={INDUSTRY_OPTIONS}
            />

            <SelectField
              label="Tier"
              placeholder="Seleccionar tier"
              value={tier}
              onChange={setTier}
              options={TIER_OPTIONS}
            />
          </div>
        </div>

        {/* ── Card 2: Contrato ───────────────────────────────────────── */}
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-6 max-md:p-4">
          <SectionHeader icon={IconContract} title="Contrato" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <NumberField
                value={arr ?? undefined}
                onChange={(v) => setArr(isNaN(v) ? undefined : v)}
                formatOptions={{ useGrouping: false }}
                className="w-full"
              >
                <Label className="block text-sm font-medium text-[#0F1117] mb-1">ARR (USD)</Label>
                <NumberField.Group className="flex w-full border border-[#ECEEF5] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#4F6EF7]">
                  <span className="px-3 flex items-center text-[#9CA3AF] text-sm bg-[#F7F8FC] border-r border-[#ECEEF5]">$</span>
                  <NumberField.Input className="flex-1 px-3 py-2 text-sm outline-none" placeholder="120000" />
                </NumberField.Group>
              </NumberField>
              {mrrComputed !== null && (
                <p className="text-xs text-[#9CA3AF] mt-1.5">MRR calculado: {formatCurrency(mrrComputed)}</p>
              )}
            </div>

            <div className="flex flex-col justify-between">
              <DatePickerField
                label="Fecha de renovación"
                value={renewalDate}
                onChange={setRenewalDate}
              />
              <div className="mt-2">
                <RenewalChip renewalDate={renewalDate} />
              </div>
            </div>

            <DatePickerField
              label="Inicio de contrato"
              value={contractStart}
              onChange={setContractStart}
            />
          </div>
        </div>

        {/* ── Card 3: Asignación ─────────────────────────────────────── */}
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-6 max-md:p-4">
          <SectionHeader icon={IconAssignment} title="Asignación" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="CSM asignado"
              placeholder="Sin asignar"
              value={csmId}
              onChange={setCsmId}
              options={users.map(u => ({ id: u.id, label: u.name }))}
            />
          </div>
        </div>

        {/* ── Card 4: Notas del CSM ──────────────────────────────────── */}
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-6 max-md:p-4">
          <SectionHeader icon={IconNote} title="Notas del CSM" />
          <TextField value={csmNotes} onChange={setCsmNotes} className="w-full">
            <TextArea
              placeholder="Observaciones internas sobre la cuenta..."
              rows={4}
              className="w-full border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]"
            />
          </TextField>
          <p className="text-xs text-[#9CA3AF] mt-1.5">Notas visibles solo para tu equipo</p>
        </div>
      </form>
    </div>
  )
}
