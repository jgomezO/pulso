'use client'

import { useState } from 'react'
import { Button, Modal, TextField, Input, TextArea, TimeField, Checkbox } from '@heroui/react'
import { useOverlayState } from '@heroui/react'
import { Time } from '@internationalized/date'
import type { TimeValue } from 'react-aria-components'
import { Icon } from '@/components/shared/Icon'
import { IconMeeting, IconCheck, IconCopy } from '@/lib/icons'
import { DatePickerField } from '@/components/shared/DatePickerField'
import type { DateValue } from '@internationalized/date'
import type { Contact } from '@/domain/contact/Contact'

interface Props {
  accountId: string
  contacts: Contact[]
}

interface CreatedEvent {
  meetLink: string | null
  googleEventLink: string | null
}

export function NewGoogleMeetingModal({ accountId, contacts }: Props) {
  const state = useOverlayState()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<DateValue | null>(null)
  const [startTime, setStartTime] = useState<TimeValue>(new Time(10, 0))
  const [duration, setDuration] = useState('30')
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null)
  const [copied, setCopied] = useState(false)

  const contactsWithEmail = contacts.filter((c) => c.email)

  function resetForm() {
    setTitle('')
    setDescription('')
    setStartDate(null)
    setStartTime(new Time(10, 0))
    setDuration('30')
    setSelectedContactIds(new Set())
    setError(null)
    setCreatedEvent(null)
    setCopied(false)
  }

  function handleOpen() {
    resetForm()
    state.open()
  }

  function toggleContact(contactId: string) {
    setSelectedContactIds((prev) => {
      const next = new Set(prev)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return next
    })
  }

  function computeEndDateTime(start: string, durationMin: number): string {
    const startDt = new Date(start)
    return new Date(startDt.getTime() + durationMin * 60 * 1000).toISOString()
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError('El título es requerido')
      return
    }
    if (!startDate) {
      setError('La fecha es requerida')
      return
    }
    if (selectedContactIds.size === 0) {
      setError('Selecciona al menos un contacto')
      return
    }

    setSubmitting(true)
    setError(null)

    // Build ISO datetime from DateValue + TimeValue
    const dateStr = startDate.toString() // "2026-04-21"
    const timeStr = `${String(startTime.hour).padStart(2, '0')}:${String(startTime.minute).padStart(2, '0')}`
    const startDateTime = new Date(`${dateStr}T${timeStr}`).toISOString()
    const endDateTime = computeEndDateTime(startDateTime, parseInt(duration))

    const attendees = contacts
      .filter((c) => selectedContactIds.has(c.id) && c.email)
      .map((c) => ({ email: c.email!, name: c.name }))

    try {
      const res = await fetch('/api/integrations/google-calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          title: title.trim(),
          description: description.trim() || undefined,
          startDateTime,
          endDateTime,
          attendees,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Error al crear evento')
        return
      }

      setCreatedEvent({
        meetLink: data.meetLink,
        googleEventLink: data.googleEventLink,
      })
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopy() {
    if (createdEvent?.meetLink) {
      await navigator.clipboard.writeText(createdEvent.meetLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const inputClass = 'w-full bg-[#F7F8FC] border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4F6EF7] transition-colors'

  return (
    <>
      <Button variant="secondary" onPress={handleOpen}>
        <Icon icon={IconMeeting} size={16} />
        <span className="ml-1">Nueva reunión</span>
      </Button>

      <Modal.Root state={state}>
        <Modal.Backdrop isDismissable>
          <Modal.Container size="lg" placement="center" scroll="inside">
            <Modal.Dialog>
              <Modal.Header>
                <p className="font-semibold text-[#0F1117]">Nueva reunión en Google Calendar</p>
              </Modal.Header>
              <Modal.Body>
                {!createdEvent ? (
                  <div className="space-y-4">
                    {/* Title */}
                    <TextField value={title} onChange={setTitle} isRequired aria-label="Título" className="w-full">
                      <Input placeholder="Título (ej: QBR Q2 2026)" className={inputClass} />
                    </TextField>

                    {/* Description */}
                    <TextField value={description} onChange={setDescription} aria-label="Descripción" className="w-full">
                      <TextArea
                        placeholder="Agenda o notas para la reunión (opcional)"
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    </TextField>

                    {/* Date + Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <DatePickerField
                        label="Fecha"
                        value={startDate}
                        onChange={setStartDate}
                        className="min-w-0"
                      />
                      <div>
                        <span className="block text-sm font-medium text-[#0F1117] mb-1.5">Hora</span>
                        <TimeField.Root
                          value={startTime}
                          onChange={(val) => { if (val) setStartTime(val) }}
                          aria-label="Hora"
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
                    </div>

                    {/* Duration */}
                    <TextField value={duration} onChange={setDuration} aria-label="Duración" className="w-full max-w-[160px]">
                      <span className="block text-sm font-medium text-[#0F1117] mb-1.5">Duración (min)</span>
                      <Input type="number" min={5} className={inputClass} />
                    </TextField>

                    {/* Contact selection */}
                    <div>
                      <span className="block text-sm font-medium text-[#0F1117] mb-2">
                        Invitar contactos ({selectedContactIds.size} seleccionados)
                      </span>
                      {contactsWithEmail.length === 0 ? (
                        <p className="text-sm text-[#9CA3AF]">
                          No hay contactos con email en esta cuenta.
                        </p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border border-[#ECEEF5] rounded-xl p-2 space-y-1">
                          {contactsWithEmail.map((contact) => (
                            <Checkbox.Root
                              key={contact.id}
                              isSelected={selectedContactIds.has(contact.id)}
                              onChange={() => toggleContact(contact.id)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F7F8FC] cursor-pointer"
                            >
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <Checkbox.Content>
                                <div className="flex items-center gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-[#0F1117] truncate">
                                      {contact.name}
                                    </p>
                                    <p className="text-xs text-[#9CA3AF] truncate">{contact.email}</p>
                                  </div>
                                  {contact.role && (
                                    <span className="text-[10px] font-medium text-[#6B7280] bg-[#F7F8FC] px-2 py-0.5 rounded-md flex-shrink-0">
                                      {contact.role}
                                    </span>
                                  )}
                                </div>
                              </Checkbox.Content>
                            </Checkbox.Root>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#9CA3AF]">
                      Se creará un link de Google Meet automáticamente.
                    </p>

                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <Icon icon={IconCheck} size={20} />
                      <span className="font-medium">Reunión creada exitosamente</span>
                    </div>

                    {createdEvent.meetLink && (
                      <div>
                        <p className="text-sm font-medium text-[#0F1117] mb-1">Link de Google Meet:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm bg-[#F7F8FC] border border-[#ECEEF5] rounded-lg px-3 py-2 truncate block">
                            {createdEvent.meetLink}
                          </code>
                          <Button variant="secondary" onPress={handleCopy}>
                            <Icon icon={copied ? IconCheck : IconCopy} size={16} />
                            <span className="ml-1">{copied ? 'Copiado' : 'Copiar'}</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {createdEvent.googleEventLink && (
                      <a
                        href={createdEvent.googleEventLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4F6EF7] hover:underline inline-block"
                      >
                        Ver evento en Google Calendar
                      </a>
                    )}
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
                {!createdEvent ? (
                  <>
                    <Button variant="ghost" onPress={() => state.close()}>
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      onPress={handleSubmit}
                      isDisabled={submitting}
                    >
                      {submitting ? 'Creando...' : 'Crear reunión'}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onPress={() => state.close()}>
                    Cerrar
                  </Button>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </>
  )
}
