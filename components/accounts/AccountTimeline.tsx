'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, TextField, Input, TextArea, Select, ListBox, ListBoxItem, Skeleton, AlertDialog, Checkbox, TimeField } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconChevronRight, IconBack, IconCopy, IconCheck, IconClose } from '@/lib/icons'
import type { AccountEvent, EventType } from '@/domain/event/AccountEvent'
import { formatRelative, formatDate } from '@/lib/utils/date'
import { DatePickerField } from '@/components/shared/DatePickerField'
import { parseDate, Time, type CalendarDate } from '@internationalized/date'
import type { TimeValue } from 'react-aria-components'

// ── Type config ────────────────────────────────────────────────────────────────

type EventTypeConfig = {
  label: string
  bgColor: string
  textColor: string
  dotColor: string
  icon: React.ReactNode
}

const TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  note: {
    label: 'Nota', bgColor: '#F7F8FC', textColor: '#6B7280', dotColor: '#9CA3AF',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  email: {
    label: 'Email', bgColor: '#EEF1FE', textColor: '#4F6EF7', dotColor: '#4F6EF7',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  call: {
    label: 'Llamada', bgColor: '#E8FAF0', textColor: '#22C55E', dotColor: '#22C55E',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  meeting: {
    label: 'Reunión', bgColor: '#F0EEFF', textColor: '#6C4EF2', dotColor: '#6C4EF2',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  ticket: {
    label: 'Ticket', bgColor: '#FEF3E8', textColor: '#F58C37', dotColor: '#F58C37',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  health_change: {
    label: 'Health', bgColor: '#FEE8E8', textColor: '#EF4444', dotColor: '#EF4444',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  renewal: {
    label: 'Renovación', bgColor: '#E8F0FE', textColor: '#4F6EF7', dotColor: '#4F6EF7',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  milestone: {
    label: 'Hito', bgColor: '#E8FAF0', textColor: '#22C55E', dotColor: '#22C55E',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
}

function getSentimentDotColor(sentiment: string | null | undefined, type: EventType) {
  if (sentiment === 'positive') return '#22C55E'
  if (sentiment === 'negative') return '#EF4444'
  return TYPE_CONFIG[type].dotColor
}

// ── Metadata renderer ─────────────────────────────────────────────────────────

function EventMeta({ event }: { event: AccountEvent }) {
  const meta = event.metadata as Record<string, unknown> | null
  if (!meta) return null

  if (event.type === 'email') {
    return (
      <p className="text-xs text-[#6B7280] mt-1.5">
        {meta.direction === 'sent'
          ? <span className="inline-flex items-center gap-1"><Icon icon={IconChevronRight} size={12} /> Enviado</span>
          : <span className="inline-flex items-center gap-1"><Icon icon={IconBack} size={12} /> Recibido</span>
        }
      </p>
    )
  }
  if (event.type === 'call') {
    return (
      <p className="text-xs text-[#6B7280] mt-1.5">
        {meta.duration_minutes ? `Duración: ${meta.duration_minutes} min` : ''}
      </p>
    )
  }
  if (event.type === 'meeting') {
    const attendees = Array.isArray(meta.attendees) ? meta.attendees as string[] : []
    const meetLink = meta.meetLink as string | null
    const googleEventId = meta.googleEventId as string | null
    const cancelled = meta.cancelled as boolean | undefined
    return <MeetingMeta event={event} attendees={attendees} meetLink={meetLink} googleEventId={googleEventId} cancelled={cancelled} durationMinutes={meta.duration_minutes as number | undefined} />
  }
  if (event.type === 'ticket') {
    const STATUS_COLOR: Record<string, string> = {
      open:     'bg-[#FEF3E8] text-[#F58C37]',
      resolved: 'bg-[#E8FAF0] text-[#22C55E]',
      pending:  'bg-[#F7F8FC] text-[#6B7280]',
    }
    const PRIORITY_COLOR: Record<string, string> = {
      critical: 'bg-[#FEE8E8] text-[#EF4444]',
      high:     'bg-[#FEF3E8] text-[#F58C37]',
      medium:   'bg-[#EEF1FE] text-[#4F6EF7]',
      low:      'bg-[#F7F8FC] text-[#6B7280]',
    }
    const status   = (meta.status   as string) ?? ''
    const priority = (meta.priority as string) ?? ''
    return (
      <div className="flex gap-1.5 mt-1.5">
        {status && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${STATUS_COLOR[status] ?? ''}`}>
            {status}
          </span>
        )}
        {priority && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${PRIORITY_COLOR[priority] ?? ''}`}>
            {priority}
          </span>
        )}
      </div>
    )
  }
  return null
}

// ── Meeting metadata with Meet link + cancel ─────────────────────────────────

function MeetingMeta({ event, attendees, meetLink, googleEventId, cancelled, durationMinutes }: {
  event: AccountEvent
  attendees: string[]
  meetLink: string | null
  googleEventId: string | null
  cancelled: boolean | undefined
  durationMinutes: number | undefined
}) {
  const [copied, setCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [isCancelled, setIsCancelled] = useState(!!cancelled)

  async function handleCopy() {
    if (meetLink) {
      await navigator.clipboard.writeText(meetLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCancel(close: () => void) {
    if (!googleEventId) return

    setCancelling(true)
    try {
      const res = await fetch('/api/integrations/google-calendar/events/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, googleEventId }),
      })
      if (res.ok) {
        setIsCancelled(true)
      }
    } finally {
      setCancelling(false)
      close()
    }
  }

  if (isCancelled) {
    return (
      <div className="mt-1.5">
        <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
          Reunión cancelada
        </span>
      </div>
    )
  }

  return (
    <div className="mt-1.5 space-y-1.5">
      {attendees.length > 0 && (
        <p className="text-xs text-[#6B7280]">
          Asistentes: {attendees.join(', ')}
          {durationMinutes ? ` · ${durationMinutes} min` : ''}
        </p>
      )}
      {meetLink && (
        <div className="flex items-center gap-2">
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4F6EF7] hover:underline truncate max-w-[200px]"
          >
            {meetLink}
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-0.5 text-[10px] text-[#6B7280] hover:text-[#4F6EF7] transition-colors"
          >
            <Icon icon={copied ? IconCheck : IconCopy} size={12} />
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
      {googleEventId && !isCancelled && (
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <button className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 cursor-pointer transition-colors mt-1 py-1 px-2 rounded-md hover:bg-red-50">
              <Icon icon={IconClose} size={14} />
              Cancelar reunión
            </button>
          </AlertDialog.Trigger>
          <AlertDialog.Backdrop>
            <AlertDialog.Container placement="center">
              <AlertDialog.Dialog>
                {({ close }) => (
                  <>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Header>
                      <AlertDialog.Heading>Cancelar reunión</AlertDialog.Heading>
                    </AlertDialog.Header>
                    <AlertDialog.Body>
                      <p className="text-sm text-[#6B7280]">
                        Esta acción eliminará el evento de Google Calendar y notificará a los asistentes. No se puede deshacer.
                      </p>
                    </AlertDialog.Body>
                    <AlertDialog.Footer>
                      <Button variant="ghost" onPress={close}>
                        No, mantener
                      </Button>
                      <Button
                        variant="danger"
                        onPress={() => handleCancel(close)}
                        isDisabled={cancelling}
                      >
                        {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
                      </Button>
                    </AlertDialog.Footer>
                  </>
                )}
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog.Root>
      )}
    </div>
  )
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: AccountEvent }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.note
  const longDesc = (event.description?.length ?? 0) > 180
  const dotColor = getSentimentDotColor(event.sentiment, event.type)

  return (
    <div className="flex gap-3 relative">
      {/* Dot on timeline */}
      <div className="relative flex-shrink-0 w-9 flex flex-col items-center">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 border-white"
          style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}
        >
          {cfg.icon}
        </div>
        {event.sentiment && (
          <div
            className="absolute -right-0.5 top-0 w-2 h-2 rounded-full border border-white"
            style={{ backgroundColor: dotColor }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-5">
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide"
                style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}
              >
                {cfg.label}
              </span>
              {event.title && (
                <span className="text-sm font-medium text-[#0F1117] truncate max-w-[240px]">
                  {event.title}
                </span>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <span
                className="text-[11px] text-[#9CA3AF] cursor-default"
                title={formatDate(event.occurredAt)}
              >
                {formatRelative(event.occurredAt)}
              </span>
            </div>
          </div>

          {event.description && (
            <div>
              <p className={`text-sm text-[#6B7280] leading-relaxed ${!expanded && longDesc ? 'line-clamp-3' : ''}`}>
                {event.description}
              </p>
              {longDesc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setExpanded(!expanded)}
                  className="text-xs text-[#4F6EF7] mt-1 hover:underline p-0 h-auto min-w-0"
                >
                  {expanded ? 'Ver menos' : 'Ver más'}
                </Button>
              )}
            </div>
          )}

          <EventMeta event={event} />
        </div>
      </div>
    </div>
  )
}

// ── Activity form ─────────────────────────────────────────────────────────────

const FORM_TYPES: { value: EventType; label: string }[] = [
  { value: 'note',      label: 'Nota'       },
  { value: 'email',     label: 'Email'      },
  { value: 'call',      label: 'Llamada'    },
  { value: 'meeting',   label: 'Reunión'    },
  { value: 'ticket',    label: 'Ticket'     },
  { value: 'renewal',   label: 'Renovación' },
  { value: 'milestone', label: 'Hito'       },
]

function ActivityForm({
  accountId,
  onCreated,
  onCancel,
}: {
  accountId: string
  onCreated: () => void
  onCancel: () => void
}) {
  const defaultDate = (): CalendarDate => {
    try { return parseDate(new Date().toISOString().slice(0, 10)) } catch { return parseDate('2024-01-01') }
  }

  const [type,         setType]         = useState<EventType>('note')
  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [sentiment,    setSentiment]    = useState('')
  const [occurredAt,   setOccurredAt]   = useState<CalendarDate | null>(defaultDate)
  const [duration,     setDuration]     = useState('')
  const [direction,    setDirection]    = useState<'sent' | 'received'>('sent')
  const [ticketStatus, setTicketStatus] = useState<'open' | 'resolved' | 'pending'>('open')
  const [priority,     setPriority]     = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [withGoogleMeet, setWithGoogleMeet] = useState(false)
  const [meetTime,     setMeetTime]     = useState<TimeValue>(new Time(10, 0))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,        setError]        = useState('')
  const [createdMeetLink, setCreatedMeetLink] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreatedMeetLink(null)
    setIsSubmitting(true)

    const meta: Record<string, unknown> = {}
    if (type === 'email')    meta.direction = direction
    if (type === 'call'    && duration) meta.duration_minutes = Number(duration)
    if (type === 'meeting' && duration) meta.duration_minutes = Number(duration)
    if (type === 'ticket') { meta.status = ticketStatus; meta.priority = priority }

    // If meeting with Google Meet, create via Google Calendar API
    if (type === 'meeting' && withGoogleMeet) {
      const dateStr = occurredAt ? occurredAt.toString() : new Date().toISOString().slice(0, 10)
      const timeStr = `${String(meetTime.hour).padStart(2, '0')}:${String(meetTime.minute).padStart(2, '0')}`
      const startDateTime = new Date(`${dateStr}T${timeStr}`).toISOString()
      const durationMin = duration ? parseInt(duration) : 30
      const endDateTime = new Date(new Date(startDateTime).getTime() + durationMin * 60 * 1000).toISOString()

      const res = await fetch('/api/integrations/google-calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          title: title.trim() || 'Reunión',
          description: description.trim() || undefined,
          startDateTime,
          endDateTime,
          attendees: [{ email: 'meeting@placeholder.com', name: 'Attendee' }],
        }),
      })

      setIsSubmitting(false)
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error al crear evento en Google Calendar' }))
        setError(typeof data.error === 'string' ? data.error : 'Error al crear evento en Google Calendar')
        return
      }

      const data = await res.json()
      if (data.meetLink) setCreatedMeetLink(data.meetLink)
      onCreated()
      return
    }

    const res = await fetch(`/api/accounts/${accountId}/events`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type,
        title:       title.trim()       || null,
        description: description.trim() || null,
        sentiment:   sentiment          || null,
        metadata:    Object.keys(meta).length > 0 ? meta : null,
        occurredAt:  occurredAt ? new Date(occurredAt.toString()).toISOString() : new Date().toISOString(),
      }),
    })

    setIsSubmitting(false)
    if (!res.ok) { setError('Error al guardar la actividad'); return }

    onCreated()
  }

  const inputClass = "w-full h-9 bg-[#F7F8FC] border border-[#ECEEF5] rounded-xl px-3 text-sm text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4F6EF7] transition-colors"

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#ECEEF5] rounded-[14px] p-5 mb-5">
      <h3 className="text-sm font-semibold text-[#0F1117] mb-4">Registrar actividad</h3>

      {/* Type selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FORM_TYPES.map(ft => (
          <Button
            key={ft.value}
            type="button"
            size="sm"
           
            onPress={() => setType(ft.value)}
            className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors min-w-0 ${
              type === ft.value
                ? 'text-white'
                : 'bg-[#F7F8FC] text-[#6B7280] border border-[#ECEEF5] hover:border-[#4F6EF7]'
            }`}
            style={type === ft.value ? { backgroundColor: TYPE_CONFIG[ft.value].dotColor } : undefined}
          >
            {ft.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Title */}
        <TextField value={title} onChange={setTitle} isRequired={type !== 'note'} className="w-full">
          <Input
            placeholder={type === 'note' ? 'Título (opcional)' : 'Título'}
            className={inputClass}
          />
        </TextField>

        {/* Description */}
        <TextField value={description} onChange={setDescription} className="w-full">
          <TextArea
            placeholder="Descripción o notas..."
            rows={3}
            className="w-full bg-[#F7F8FC] border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4F6EF7] transition-colors resize-none"
          />
        </TextField>

        {/* Duration for call/meeting */}
        {(type === 'call' || type === 'meeting') && (
          <TextField value={duration} onChange={setDuration} className="w-full">
            <Input
              type="number"
              placeholder="Duración en minutos"
              min={1}
              className={inputClass}
            />
          </TextField>
        )}

        {/* Google Meet toggle for meetings */}
        {type === 'meeting' && (
          <div className="space-y-2">
            <Checkbox.Root
              isSelected={withGoogleMeet}
              onChange={setWithGoogleMeet}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <span className="text-sm text-[#0F1117]">Crear con Google Meet</span>
              </Checkbox.Content>
            </Checkbox.Root>
            {withGoogleMeet && (
              <div className="flex flex-col gap-1.5 max-w-[160px]">
                <span className="block text-sm font-medium text-[#0F1117]">Hora</span>
                <TimeField.Root
                  value={meetTime}
                  onChange={(val) => { if (val) setMeetTime(val) }}
                  aria-label="Hora de la reunión"
                  className="w-full"
                >
                  <TimeField.Group>
                    <TimeField.InputContainer>
                      <TimeField.Input>
                        {(segment) => <TimeField.Segment segment={segment} />}
                      </TimeField.Input>
                    </TimeField.InputContainer>
                  </TimeField.Group>
                </TimeField.Root>
              </div>
            )}
            {createdMeetLink && (
              <div className="flex items-center gap-2 p-2 bg-[#E8FAF0] rounded-lg">
                <a
                  href={createdMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#4F6EF7] hover:underline truncate"
                >
                  {createdMeetLink}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onPress={async () => { await navigator.clipboard.writeText(createdMeetLink) }}
                  className="flex items-center gap-0.5 text-[10px] text-[#6B7280] hover:text-[#4F6EF7] p-1 h-auto min-w-0"
                >
                  <Icon icon={IconCopy} size={12} />
                  Copiar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Email direction */}
        {type === 'email' && (
          <Select.Root
            selectedKey={direction}
            onSelectionChange={key => setDirection((key as 'sent' | 'received') ?? 'sent')}
            className="w-full"
          >
            <Select.Trigger className={`${inputClass} flex items-center justify-between cursor-pointer`}>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBoxItem id="sent">Enviado</ListBoxItem>
                <ListBoxItem id="received">Recibido</ListBoxItem>
              </ListBox>
            </Select.Popover>
          </Select.Root>
        )}

        {/* Ticket fields */}
        {type === 'ticket' && (
          <div className="grid grid-cols-2 gap-2">
            <Select.Root
              selectedKey={ticketStatus}
              onSelectionChange={key => setTicketStatus((key as typeof ticketStatus) ?? 'open')}
              className="w-full"
            >
              <Select.Trigger className={`${inputClass} flex items-center justify-between cursor-pointer`}>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="open">Abierto</ListBoxItem>
                  <ListBoxItem id="pending">Pendiente</ListBoxItem>
                  <ListBoxItem id="resolved">Resuelto</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select.Root>

            <Select.Root
              selectedKey={priority}
              onSelectionChange={key => setPriority((key as typeof priority) ?? 'medium')}
              className="w-full"
            >
              <Select.Trigger className={`${inputClass} flex items-center justify-between cursor-pointer`}>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="low">Prioridad baja</ListBoxItem>
                  <ListBoxItem id="medium">Prioridad media</ListBoxItem>
                  <ListBoxItem id="high">Prioridad alta</ListBoxItem>
                  <ListBoxItem id="critical">Crítico</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select.Root>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 items-end">
          <DatePickerField
            label="Fecha"
            value={occurredAt}
            onChange={(date) => setOccurredAt((date ?? null) as CalendarDate | null)}
          />

          {/* Sentiment */}
          <div className="flex flex-col gap-1.5 w-full">
            <span className="block text-sm font-medium text-[#0F1117]">Sentiment</span>
            <Select.Root
              selectedKey={sentiment}
              onSelectionChange={key => setSentiment((key as string) ?? '')}
              className="w-full"
            >
              <Select.Trigger className={`${inputClass} flex items-center justify-between cursor-pointer`}>
                <Select.Value>{({ isPlaceholder }: { isPlaceholder: boolean }) => isPlaceholder ? 'Sin sentiment' : undefined}</Select.Value>
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="">Sin sentiment</ListBoxItem>
                  <ListBoxItem id="positive">Positivo</ListBoxItem>
                  <ListBoxItem id="neutral">Neutral</ListBoxItem>
                  <ListBoxItem id="negative">Negativo</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select.Root>
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-[#EF4444] mt-3">{error}</p>}

      <div className="flex gap-2 mt-4">
        <Button
          type="submit"
          isDisabled={isSubmitting}
          className="h-9 px-4 bg-[#4F6EF7] text-white rounded-xl text-sm font-medium hover:bg-[#3451D1] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onPress={onCancel}
          className="h-9 px-4 bg-white border border-[#ECEEF5] text-[#6B7280] rounded-xl text-sm font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTER_TABS: { value: EventType | undefined; label: string }[] = [
  { value: undefined,   label: 'Todos'    },
  { value: 'note',      label: 'Notas'    },
  { value: 'email',     label: 'Emails'   },
  { value: 'call',      label: 'Llamadas' },
  { value: 'meeting',   label: 'Reuniones'},
  { value: 'ticket',    label: 'Tickets'  },
]

// ── Main component ────────────────────────────────────────────────────────────

interface AccountTimelineProps {
  accountId: string
}

export function AccountTimeline({ accountId }: AccountTimelineProps) {
  const [activeFilter, setActiveFilter]   = useState<EventType | undefined>(undefined)
  const [events,       setEvents]         = useState<AccountEvent[]>([])
  const [page,         setPage]           = useState(1)
  const [hasMore,      setHasMore]        = useState(false)
  const [isLoading,    setIsLoading]      = useState(true)
  const [isLoadingMore,setIsLoadingMore]  = useState(false)
  const [formOpen,     setFormOpen]       = useState(false)
  const [counts,       setCounts]         = useState<Partial<Record<EventType, number>>>({})

  useEffect(() => {
    fetch(`/api/accounts/${accountId}/events?counts=true`)
      .then(r => r.json())
      .then(json => { if (json.counts) setCounts(json.counts) })
      .catch(() => {})
  }, [accountId])

  const fetchPage = useCallback(
    async (filter: EventType | undefined, pageNum: number, append: boolean) => {
      if (append) setIsLoadingMore(true)
      else        setIsLoading(true)

      const p = new URLSearchParams({ page: String(pageNum), pageSize: '20' })
      if (filter) p.set('type', filter)

      try {
        const res  = await fetch(`/api/accounts/${accountId}/events?${p}`)
        const json = await res.json()
        if (append) setEvents(prev => [...prev, ...(json.data ?? [])])
        else        setEvents(json.data ?? [])
        setHasMore(json.hasMore ?? false)
      } finally {
        if (append) setIsLoadingMore(false)
        else        setIsLoading(false)
      }
    },
    [accountId]
  )

  useEffect(() => {
    setPage(1)
    fetchPage(activeFilter, 1, false)
  }, [activeFilter, fetchPage])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    fetchPage(activeFilter, next, true)
  }

  function handleCreated() {
    setFormOpen(false)
    setPage(1)
    fetchPage(activeFilter, 1, false)
    fetch(`/api/accounts/${accountId}/events?counts=true`)
      .then(r => r.json())
      .then(json => { if (json.counts) setCounts(json.counts) })
      .catch(() => {})
  }

  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)

  return (
    <div>
      {/* Register button / form */}
      {!formOpen ? (
        <Button
         
          onPress={() => setFormOpen(true)}
          className="mb-4 h-9 px-4 bg-white border border-[#ECEEF5] text-[#4F6EF7] rounded-xl text-sm font-medium hover:bg-[#EEF1FE] transition-colors"
        >
          + Registrar actividad
        </Button>
      ) : (
        <ActivityForm
          accountId={accountId}
          onCreated={handleCreated}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap mb-5">
        {FILTER_TABS.map(tab => {
          const count = tab.value ? (counts[tab.value] ?? 0) : total
          const isActive = activeFilter === tab.value
          return (
            <Button
              key={tab.value ?? 'all'}
              size="sm"
             
              onPress={() => setActiveFilter(tab.value)}
              className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors min-w-0 ${
                isActive
                  ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                  : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
              }`}
            >
              {tab.label}{count > 0 ? ` (${count})` : ''}
            </Button>
          )
        })}
      </div>

      {/* Timeline content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
              <Skeleton className="h-20 flex-1 rounded-[14px]" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-8 text-center">
          <p className="text-sm text-[#9CA3AF]">No hay actividades registradas.</p>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setFormOpen(true)}
            className="mt-2 text-sm text-[#4F6EF7] hover:underline p-0 h-auto min-w-0"
          >
            <span className="inline-flex items-center gap-1">Registrar la primera actividad <Icon icon={IconChevronRight} size={12} /></span>
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-[#ECEEF5]" />

          <div>
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-2 ml-12">
              <Button
               
                onPress={handleLoadMore}
                isDisabled={isLoadingMore}
                className="h-8 px-4 bg-white border border-[#ECEEF5] text-[#6B7280] rounded-xl text-xs font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? 'Cargando...' : 'Cargar más actividades'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
