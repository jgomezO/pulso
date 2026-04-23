'use client'

import { useState } from 'react'
import { Button } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconTasks, IconEmail, IconNote, IconMeeting, IconCheck, IconClose } from '@/lib/icons'
import type { CopilotAction } from '@/lib/copilot/actionParser'

// ──────────── shared ────────────

interface ActionFormProps {
  accountId: string
  action: CopilotAction
  onDone: (confirmation: string) => void
  onCancel: () => void
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full h-8 px-2.5 text-xs rounded-lg border border-[#ECEEF5] bg-white text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7] focus:border-[#4F6EF7]'
const textareaClass = 'w-full px-2.5 py-2 text-xs rounded-lg border border-[#ECEEF5] bg-white text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] resize-none'

// ──────────── Create Task ────────────

function CreateTaskForm({ accountId, action, onDone, onCancel }: ActionFormProps) {
  const [title, setTitle] = useState(action.params.title || '')
  const [priority, setPriority] = useState(action.params.priority || 'medium')
  const [dueDate, setDueDate] = useState(action.params.dueDate || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, dueDate: dueDate || null }),
      })
      if (!res.ok) throw new Error('Failed')
      onDone(`Tarea creada: "${title}"${dueDate ? ` — vence ${dueDate}` : ''}`)
    } catch {
      onDone('Error al crear la tarea. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const PRIORITIES = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
  ]

  return (
    <div className="space-y-2">
      <FormField label="Título">
        <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Título de la tarea" />
      </FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Prioridad">
          <select value={priority} onChange={e => setPriority(e.target.value)} className={inputClass}>
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </FormField>
        <FormField label="Vencimiento">
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
        </FormField>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onPress={handleSave} isDisabled={!title.trim() || saving} className="h-7 px-3 rounded-lg bg-[#4F6EF7] text-white text-xs font-medium min-w-0">
          {saving ? 'Creando...' : 'Crear tarea'}
        </Button>
        <Button size="sm" variant="ghost" onPress={onCancel} className="h-7 px-3 rounded-lg text-xs text-[#9CA3AF] min-w-0">
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ──────────── Compose Email ────────────

function ComposeEmailForm({ accountId, action, onDone, onCancel }: ActionFormProps) {
  const [to, setTo] = useState(action.params.contactName || '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const emailTypeLabels: Record<string, string> = {
    check_in: 'Check-in',
    follow_up: 'Seguimiento',
    escalation: 'Escalación',
    renewal: 'Renovación',
  }

  // Pre-fill subject based on email type
  useState(() => {
    const typeLabel = emailTypeLabels[action.params.emailType] || 'Seguimiento'
    setSubject(`${typeLabel} — ${action.params.contactName || ''}`)
  })

  async function handleCopy() {
    const text = `Para: ${to}\nAsunto: ${subject}\n\n${body}`
    await navigator.clipboard.writeText(text)
    onDone(`Email copiado al portapapeles`)
  }

  function handleOpenGmail() {
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto, '_blank')
  }

  async function handleLogToTimeline() {
    setSaving(true)
    try {
      await fetch(`/api/accounts/${accountId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          title: subject || `Email a ${to}`,
          description: body || null,
          sentiment: 'neutral',
        }),
      })
      onDone(`Email registrado en timeline: "${subject || `Email a ${to}`}"`)
    } catch {
      onDone('Error al registrar el email.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <FormField label="Para">
        <input value={to} onChange={e => setTo(e.target.value)} className={inputClass} placeholder="Nombre del contacto" />
      </FormField>
      <FormField label="Asunto">
        <input value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} placeholder="Asunto del email" />
      </FormField>
      <FormField label="Cuerpo">
        <textarea value={body} onChange={e => setBody(e.target.value)} className={textareaClass} rows={4} placeholder="Escribe el contenido del email..." />
      </FormField>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onPress={handleCopy} className="h-7 px-3 rounded-lg bg-[#4F6EF7] text-white text-xs font-medium min-w-0">
          Copiar
        </Button>
        <Button size="sm" variant="ghost" onPress={handleOpenGmail} className="h-7 px-3 rounded-lg text-xs text-[#4F6EF7] border border-[#ECEEF5] min-w-0">
          Abrir en email
        </Button>
        <Button size="sm" variant="ghost" onPress={handleLogToTimeline} isDisabled={saving} className="h-7 px-3 rounded-lg text-xs text-[#6B7280] border border-[#ECEEF5] min-w-0">
          Registrar en timeline
        </Button>
        <Button size="sm" variant="ghost" onPress={onCancel} className="h-7 px-3 rounded-lg text-xs text-[#9CA3AF] min-w-0">
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ──────────── Add Note ────────────

function AddNoteForm({ accountId, action, onDone, onCancel }: ActionFormProps) {
  const [title, setTitle] = useState(action.params.title || '')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/accounts/${accountId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          title,
          description: description || null,
          sentiment: 'neutral',
        }),
      })
      onDone(`Nota registrada en el timeline: "${title}"`)
    } catch {
      onDone('Error al registrar la nota.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <FormField label="Título">
        <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Título de la nota" />
      </FormField>
      <FormField label="Descripción">
        <textarea value={description} onChange={e => setDescription(e.target.value)} className={textareaClass} rows={3} placeholder="Detalles adicionales..." />
      </FormField>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onPress={handleSave} isDisabled={!title.trim() || saving} className="h-7 px-3 rounded-lg bg-[#4F6EF7] text-white text-xs font-medium min-w-0">
          {saving ? 'Guardando...' : 'Guardar nota'}
        </Button>
        <Button size="sm" variant="ghost" onPress={onCancel} className="h-7 px-3 rounded-lg text-xs text-[#9CA3AF] min-w-0">
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ──────────── Schedule Meeting ────────────

function ScheduleMeetingForm({ accountId, action, onDone, onCancel }: ActionFormProps) {
  const [title, setTitle] = useState(action.params.description || '')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/accounts/${accountId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meeting',
          title,
          description: action.params.contactName ? `Con: ${action.params.contactName}` : null,
          sentiment: 'neutral',
          occurredAt: date ? new Date(date).toISOString() : undefined,
        }),
      })
      onDone(`Reunión registrada: "${title}"${date ? ` el ${date}` : ''}`)
    } catch {
      onDone('Error al registrar la reunión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <FormField label="Título">
        <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Título de la reunión" />
      </FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Fecha">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Contacto">
          <input value={action.params.contactName || ''} disabled className={`${inputClass} opacity-60`} />
        </FormField>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onPress={handleSave} isDisabled={!title.trim() || saving} className="h-7 px-3 rounded-lg bg-[#4F6EF7] text-white text-xs font-medium min-w-0">
          {saving ? 'Guardando...' : 'Registrar reunión'}
        </Button>
        <Button size="sm" variant="ghost" onPress={onCancel} className="h-7 px-3 rounded-lg text-xs text-[#9CA3AF] min-w-0">
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ──────────── Action Buttons + Inline Form ────────────

const ACTION_ICONS: Record<string, typeof IconTasks> = {
  create_task: IconTasks,
  compose_email: IconEmail,
  add_note: IconNote,
  schedule_meeting: IconMeeting,
}

export function ActionButtons({
  actions,
  accountId,
  onConfirmation,
}: {
  actions: CopilotAction[]
  accountId: string
  onConfirmation: (text: string) => void
}) {
  const [activeAction, setActiveAction] = useState<CopilotAction | null>(null)

  if (actions.length === 0) return null

  function handleDone(confirmation: string) {
    setActiveAction(null)
    onConfirmation(confirmation)
  }

  if (activeAction) {
    const FormComponent = {
      create_task: CreateTaskForm,
      compose_email: ComposeEmailForm,
      add_note: AddNoteForm,
      schedule_meeting: ScheduleMeetingForm,
    }[activeAction.type]

    return (
      <div className="mt-2 p-3 bg-white border border-[#ECEEF5] rounded-xl">
        <FormComponent
          accountId={accountId}
          action={activeAction}
          onDone={handleDone}
          onCancel={() => setActiveAction(null)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {actions.map((action, i) => {
        const ActionIcon = ACTION_ICONS[action.type] || IconTasks
        return (
          <Button
            key={i}
            size="sm"
            variant="ghost"
            onPress={() => setActiveAction(action)}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-[#4F6EF7] border border-[#ECEEF5] hover:border-[#4F6EF7] hover:bg-[#EEF1FE] transition-colors min-w-0 gap-1"
          >
            <Icon icon={ActionIcon} size={12} />
            {action.label.length > 35 ? action.label.slice(0, 35) + '...' : action.label}
          </Button>
        )
      })}
    </div>
  )
}

// ──────────── Action Confirmation Message ────────────

export function ActionConfirmation({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8FAF0] text-[#22C55E] rounded-[14px] rounded-bl-[4px] text-xs font-medium">
        <Icon icon={IconCheck} size={12} />
        {text}
      </div>
    </div>
  )
}
