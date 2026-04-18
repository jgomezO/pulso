'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button, Label,
  TextField, Input,
  NumberField,
  TextArea,
  Select, ListBox, ListBoxItem,
} from '@heroui/react'
import type { DateValue } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import { DatePickerField } from '@/components/shared/DatePickerField'
import type { Account } from '@/domain/account/Account'
import { useUsers } from '@/hooks/useUsers'
import { formatCurrency } from '@/lib/utils/format'

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? ''

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

const fieldClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

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
      <Label className="block text-sm text-gray-600 mb-1">{label}</Label>
      <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
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

// ── Main form ─────────────────────────────────────────────────────────────────
export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const router    = useRouter()
  const { users } = useUsers(ORG_ID)
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
  const [globalError,   setGlobalError]  = useState('')

  const mrrComputed = arr ? Math.round(arr / 12) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError('')
    setIsSubmitting(true)

    const body = {
      orgId:             ORG_ID,
      name,
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

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setIsSubmitting(false)

    if (!res.ok) {
      setGlobalError(data.error?.fieldErrors?.name?.[0] ?? 'Error al guardar')
      return
    }

    if (onSuccess) onSuccess(data)
    else router.push(`/accounts/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Información básica ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Información básica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <TextField value={name} onChange={setName} isRequired className="w-full">
              <Label className="block text-sm text-gray-600 mb-1">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Acme Corp"
                className={fieldClass}
              />
            </TextField>
          </div>

          <TextField value={domain} onChange={setDomain} className="w-full">
            <Label className="block text-sm text-gray-600 mb-1">Dominio</Label>
            <Input
              placeholder="acme.com"
              className={fieldClass}
            />
          </TextField>

          <SelectField
            label="Tier"
            placeholder="Seleccionar tier"
            value={tier}
            onChange={setTier}
            options={TIER_OPTIONS}
          />

          <SelectField
            label="Industria"
            placeholder="Seleccionar industria"
            value={industry}
            onChange={setIndustry}
            options={INDUSTRY_OPTIONS}
          />
        </div>
      </section>

      {/* ── Contrato ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Contrato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <NumberField
            value={arr ?? undefined}
            onChange={(v) => setArr(isNaN(v) ? undefined : v)}
            formatOptions={{ useGrouping: false }}
            className="w-full"
          >
            <Label className="block text-sm text-gray-600 mb-1">ARR (USD)</Label>
            <NumberField.Group className="flex w-full border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="px-3 flex items-center text-gray-400 text-sm bg-gray-50 border-r border-gray-200">$</span>
              <NumberField.Input className="flex-1 px-3 py-2 text-sm outline-none" placeholder="120000" />
            </NumberField.Group>
            {mrrComputed !== null && (
              <p className="text-xs text-gray-400 mt-1">MRR calculado: {formatCurrency(mrrComputed)}</p>
            )}
          </NumberField>

          <DatePickerField
            label="Fecha de renovación"
            value={renewalDate}
            onChange={setRenewalDate}
          />

          <DatePickerField
            label="Inicio de contrato"
            value={contractStart}
            onChange={setContractStart}
          />
        </div>
      </section>

      {/* ── Asignación ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Asignación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <SelectField
            label="CSM asignado"
            placeholder="Sin asignar"
            value={csmId}
            onChange={setCsmId}
            options={users.map(u => ({ id: u.id, label: u.name }))}
          />

          <div className="md:col-span-2">
            <TextField value={csmNotes} onChange={setCsmNotes} className="w-full">
              <Label className="block text-sm text-gray-600 mb-1">Notas del CSM</Label>
              <TextArea
                placeholder="Observaciones internas sobre la cuenta..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </TextField>
          </div>
        </div>
      </section>

      {globalError && <p className="text-sm text-red-500">{globalError}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" isDisabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
        <Button type="button" variant="ghost" onPress={() => router.back()} isDisabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
