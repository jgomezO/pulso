'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  Modal,
  Select,
  ListBox,
  ListBoxItem,
  TextField,
  Input,
  TextArea,
  Chip,
  useOverlayState,
} from '@heroui/react'
import type { Contact } from '@/domain/contact/Contact'
import type { EmailType } from '@/infrastructure/ai/prompts/email-composer.prompt'
import { Icon } from '@/components/shared/Icon'
import { IconEmail, IconCopy, IconSend, IconAI, IconWarning, IconEdit } from '@/lib/icons'

interface EmailComposerModalProps {
  accountId: string
  contacts: Contact[]
  isOpen?: boolean
  onClose?: () => void
}

const EMAIL_TYPE_OPTIONS: { id: EmailType; label: string }[] = [
  { id: 'check-in', label: 'Check-in' },
  { id: 'follow-up', label: 'Follow-up' },
  { id: 'escalation', label: 'Escalacion' },
  { id: 'renewal', label: 'Renovacion' },
]

const inputClass = 'w-full bg-white border border-[#ECEEF5] rounded-xl px-3 text-sm text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4F6EF7] transition-colors'

type Step = 'config' | 'editor'

export function EmailComposerModal({ accountId, contacts, isOpen, onClose }: EmailComposerModalProps) {
  const controlled = isOpen !== undefined
  const state = useOverlayState(controlled ? { isOpen, onOpenChange: (open) => { if (!open) onClose?.() } } : undefined)

  // Step 1: Config
  const [emailType, setEmailType] = useState<EmailType>('check-in')
  const [contactId, setContactId] = useState<string>('')
  const [additionalContext, setAdditionalContext] = useState('')

  // Editor fields
  const [to, setTo] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [tip, setTip] = useState<string | null>(null)

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<Step>('config')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sentEmailId, setSentEmailId] = useState<string | null>(null)

  const contactsWithEmail = contacts.filter(c => c.email)

  function resetAll() {
    setStep('config')
    setEmailType('check-in')
    setContactId('')
    setAdditionalContext('')
    setSubject('')
    setBody('')
    setTo('')
    setRecipientName('')
    setTip(null)
    setError(null)
    setCopied(false)
    setIsGenerating(false)
    setIsImproving(false)
    setIsSending(false)
    setSendError(null)
    setSentEmailId(null)
  }

  useEffect(() => {
    if (isOpen) resetAll()
  }, [isOpen])

  function handleOpen() {
    resetAll()
    state.open()
  }

  function resolveContactEmail(): string | null {
    const contact = contactsWithEmail.find(c => c.id === contactId)
    return contact?.email ?? null
  }

  function resolveContactName(): string {
    const contact = contactsWithEmail.find(c => c.id === contactId)
    return contact?.name ?? ''
  }

  // Option 1: Generate full email with AI
  async function handleGenerate() {
    if (!contactId) return
    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch(`/api/accounts/${accountId}/compose-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          emailType,
          contactId,
          additionalContext: additionalContext.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al generar email')
      }

      const data = await res.json()
      setTo(data.to)
      setRecipientName(data.recipientName)
      setSubject(data.subject)
      setBody(data.body)
      setTip(data.tip)
      setStep('editor')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsGenerating(false)
    }
  }

  // Option 2: Write manually — go to editor with empty fields
  function handleWriteManually() {
    if (!contactId) return
    const email = resolveContactEmail()
    if (!email) return
    setTo(email)
    setRecipientName(resolveContactName())
    setSubject('')
    setBody('')
    setTip(null)
    setStep('editor')
  }

  // Improve existing email with AI
  async function handleImprove() {
    if (!subject.trim() && !body.trim()) return
    setIsImproving(true)
    setError(null)

    try {
      const res = await fetch(`/api/accounts/${accountId}/compose-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'improve',
          emailType,
          contactId,
          currentSubject: subject,
          currentBody: body,
          additionalContext: additionalContext.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al mejorar email')
      }

      const data = await res.json()
      setSubject(data.subject)
      setBody(data.body)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsImproving(false)
    }
  }

  async function logToTimeline(action: 'copy' | 'gmail') {
    try {
      await fetch(`/api/accounts/${accountId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          title: subject,
          description: `Email de ${emailType} a ${recipientName} (${to}). ${action === 'copy' ? 'Copiado al portapapeles.' : 'Abierto en Gmail.'}`,
          sentiment: 'neutral',
          metadata: {
            emailType,
            recipient: to,
            recipientName,
            action,
          },
          occurredAt: new Date().toISOString(),
        }),
      })
    } catch {
      // Silent — don't block UX for logging failure
    }
  }

  async function handleCopy() {
    const text = `Asunto: ${subject}\n\n${body}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    logToTimeline('copy')
  }

  function handleOpenGmail() {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto, '_blank')
    logToTimeline('gmail')
  }

  async function handleSend() {
    setIsSending(true)
    setSendError(null)

    try {
      const res = await fetch(`/api/accounts/${accountId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          subject,
          body,
          emailType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSentEmailId(data.sentEmailId ?? null)
        throw new Error(data.error ?? 'Error al enviar email')
      }

      setSentEmailId(data.sentEmailId)
      handleClose()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSending(false)
    }
  }

  async function handleRetry() {
    if (!sentEmailId) {
      await handleSend()
      return
    }

    setIsSending(true)
    setSendError(null)

    try {
      const res = await fetch(`/api/accounts/${accountId}/send-email/${sentEmailId}/retry`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Error al reenviar email')
      }

      handleClose()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSending(false)
    }
  }

  function handleClose() {
    state.close()
  }

  function handleBack() {
    setStep('config')
    setError(null)
    setSendError(null)
  }

  const canImprove = subject.trim().length > 0 || body.trim().length > 0
  const canSend = subject.trim().length > 0 && body.trim().length > 0
  const isWorking = isGenerating || isImproving || isSending

  return (
    <>
      {!controlled && (
        <button
          onClick={handleOpen}
          className="h-8 px-3 bg-white border border-[#ECEEF5] text-[#6B7280] rounded-xl text-xs font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors inline-flex items-center gap-1.5"
        >
          <Icon icon={IconEmail} size={14} />
          Email
        </button>
      )}

      <Modal.Root state={state}>
        <Modal.Backdrop isDismissable>
          <Modal.Container size="lg" placement="center" scroll="inside">
            <Modal.Dialog>
            <Modal.Header>
              <div className="flex items-center gap-2">
                <Icon icon={IconEmail} size={18} className="text-[#4F6EF7]" />
                <div>
                  <p className="font-semibold text-[#0F1117]">Componer email</p>
                  <p className="text-xs font-normal text-[#9CA3AF]">
                    {step === 'config'
                      ? 'Configura el tipo y destinatario'
                      : 'Edita y envía tu email'}
                  </p>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body>
              {step === 'config' ? (
                <div className="space-y-4">
                  {/* Email type */}
                  <div className="flex flex-col gap-1.5">
                    <span className="block text-sm font-medium text-[#0F1117]">Tipo de email</span>
                    <Select.Root
                      selectedKey={emailType}
                      onSelectionChange={key => setEmailType((key as EmailType) ?? 'check-in')}
                      className="w-full"
                    >
                      <Select.Trigger className="w-full h-10 flex items-center justify-between px-3 border border-[#ECEEF5] rounded-xl text-sm cursor-pointer hover:border-[#4F6EF7] transition-colors">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {EMAIL_TYPE_OPTIONS.map(opt => (
                            <ListBoxItem key={opt.id} id={opt.id}>{opt.label}</ListBoxItem>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select.Root>
                  </div>

                  {/* Contact selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="block text-sm font-medium text-[#0F1117]">Destinatario</span>
                    {contactsWithEmail.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF]">
                        No hay contactos con email registrado en esta cuenta.
                      </p>
                    ) : (
                      <Select.Root
                        selectedKey={contactId}
                        onSelectionChange={key => setContactId((key as string) ?? '')}
                        className="w-full"
                      >
                        <Select.Trigger className="w-full h-10 flex items-center justify-between px-3 border border-[#ECEEF5] rounded-xl text-sm cursor-pointer hover:border-[#4F6EF7] transition-colors">
                          <Select.Value>
                            {({ isPlaceholder }: { isPlaceholder: boolean }) =>
                              isPlaceholder ? 'Seleccionar contacto' : undefined
                            }
                          </Select.Value>
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {contactsWithEmail.map(c => (
                              <ListBoxItem key={c.id} id={c.id}>
                                {c.name}{c.title ? ` — ${c.title}` : ''}
                              </ListBoxItem>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select.Root>
                    )}
                  </div>

                  {/* Additional context */}
                  <div className="flex flex-col gap-1.5">
                    <span className="block text-sm font-medium text-[#0F1117]">
                      Contexto adicional <span className="text-[#9CA3AF] font-normal">(opcional)</span>
                    </span>
                    <TextField value={additionalContext} onChange={setAdditionalContext} className="w-full">
                      <TextArea
                        placeholder='Ej: "Mencionar que lanzamos la feature de reportes"'
                        rows={2}
                        className={`${inputClass} py-2 resize-none`}
                      />
                    </TextField>
                  </div>

                  {error && (
                    <p className="text-xs text-[#EF4444]">{error}</p>
                  )}

                  {/* Two option cards */}
                  {contactId && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex flex-col items-center gap-2 p-4 border border-[#ECEEF5] rounded-[14px] bg-white hover:border-[#4F6EF7] hover:bg-[#EEF1FE] transition-colors text-center group disabled:opacity-50"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#EEF1FE] flex items-center justify-center group-hover:bg-[#4F6EF7]/20 transition-colors">
                          <Icon icon={IconAI} size={18} className="text-[#4F6EF7]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0F1117]">
                            {isGenerating ? 'Generando...' : 'Generar con AI'}
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">
                            AI escribe el email basado en el contexto de la cuenta
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={handleWriteManually}
                        className="flex flex-col items-center gap-2 p-4 border border-[#ECEEF5] rounded-[14px] bg-white hover:border-[#4F6EF7] hover:bg-[#EEF1FE] transition-colors text-center group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#F7F8FC] flex items-center justify-center group-hover:bg-[#4F6EF7]/20 transition-colors">
                          <Icon icon={IconEdit} size={18} className="text-[#6B7280] group-hover:text-[#4F6EF7]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0F1117]">Escribir yo</p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">
                            Escribe tu email y mejora con AI despues
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {tip && (
                    <div className="flex items-start gap-2 p-3 bg-[#EEF1FE] border border-[#4F6EF7]/20 rounded-xl">
                      <Icon icon={IconAI} size={14} className="text-[#4F6EF7] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#4F6EF7]">{tip}</p>
                    </div>
                  )}

                  {/* To field */}
                  <div className="flex flex-col gap-1.5">
                    <span className="block text-sm font-medium text-[#0F1117]">Para</span>
                    <TextField value={to} className="w-full" isReadOnly>
                      <Input className={`${inputClass} h-10 bg-[#F7F8FC]`} />
                    </TextField>
                  </div>

                  {/* Subject */}
                  <div className="flex flex-col gap-1.5">
                    <span className="block text-sm font-medium text-[#0F1117]">Asunto</span>
                    <TextField value={subject} onChange={setSubject} className="w-full">
                      <Input
                        className={`${inputClass} h-10`}
                        placeholder="Asunto del email"
                        disabled={isWorking}
                      />
                    </TextField>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="block text-sm font-medium text-[#0F1117]">Cuerpo</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={handleImprove}
                        isDisabled={!canImprove || isWorking}
                      >
                        {isImproving ? (
                          <span className="animate-pulse text-[#4F6EF7]">Mejorando...</span>
                        ) : (
                          <>
                            <Icon icon={IconAI} size={14} className="text-[#4F6EF7]" />
                            <span className="text-[#4F6EF7]">Mejorar con AI</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <TextField value={body} onChange={setBody} className="w-full">
                      <TextArea
                        rows={8}
                        className={`${inputClass} py-2 resize-none min-h-[200px]`}
                        placeholder="Escribe tu email aqui..."
                        disabled={isWorking}
                      />
                    </TextField>
                  </div>

                  {error && (
                    <p className="text-xs text-[#EF4444]">{error}</p>
                  )}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              {step === 'config' ? (
                <Button variant="ghost" onPress={handleClose}>
                  Cancelar
                </Button>
              ) : (
                <div className="flex flex-col w-full gap-2">
                  {sendError && (
                    <div className="flex items-center gap-2 p-2 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl">
                      <Icon icon={IconWarning} size={14} className="text-[#EF4444] flex-shrink-0" />
                      <p className="text-xs text-[#EF4444] flex-1">{sendError}</p>
                      <Button size="sm" variant="ghost" onPress={handleRetry} isDisabled={isSending}>
                        Reintentar
                      </Button>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <Button variant="ghost" onPress={handleBack} isDisabled={isWorking}>
                      Volver
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onPress={handleCopy}
                        isDisabled={!canSend || isWorking}
                      >
                        <Icon icon={IconCopy} size={14} />
                        {copied ? 'Copiado!' : 'Copiar'}
                      </Button>
                      <Button
                        variant="secondary"
                        onPress={handleOpenGmail}
                        isDisabled={!canSend || isWorking}
                      >
                        <Icon icon={IconEmail} size={14} />
                        Abrir en Gmail
                      </Button>
                      <Button
                        variant="primary"
                        onPress={handleSend}
                        isDisabled={!canSend || isWorking}
                      >
                        {isSending ? (
                          <span className="animate-pulse">Enviando...</span>
                        ) : (
                          <>
                            <Icon icon={IconSend} size={14} />
                            Enviar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
    </>
  )
}
