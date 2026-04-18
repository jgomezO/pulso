'use client'

import { useState, useRef } from 'react'
import { Button, TextField, Input, TextArea, Label } from '@heroui/react'
import type { Contact } from '@/domain/contact/Contact'
import { ROLE_TYPES, INFLUENCE_LEVELS, RELATIONSHIP_STATUSES } from '@/domain/contact/Contact'

const ROLE_TYPE_LABELS: Record<string, string> = {
  champion:       'Champion',
  decision_maker: 'Decision Maker',
  executive:      'Ejecutivo',
  technical:      'Técnico',
  billing:        'Billing',
  user:           'Usuario',
}

const INFLUENCE_LABELS: Record<string, string> = {
  high:   'Alta',
  medium: 'Media',
  low:    'Baja',
}

const STATUS_LABELS: Record<string, string> = {
  active:   'Activo',
  new:      'Nuevo',
  inactive: 'Inactivo',
  churned:  'Churned',
}

interface ContactModalProps {
  accountId: string
  contact?: Contact | null
  onSaved: (contact: Contact) => void
  onClose: () => void
}

export function ContactModal({ accountId, contact, onSaved, onClose }: ContactModalProps) {
  const isEdit = !!contact
  const overlayRef = useRef<HTMLDivElement>(null)

  const [name, setName]                         = useState(contact?.name ?? '')
  const [email, setEmail]                       = useState(contact?.email ?? '')
  const [title, setTitle]                       = useState(contact?.title ?? '')
  const [phone, setPhone]                       = useState(contact?.phone ?? '')
  const [roleType, setRoleType]                 = useState<string>(contact?.roleType ?? 'user')
  const [influenceLevel, setInfluenceLevel]     = useState<string>(contact?.influenceLevel ?? 'medium')
  const [relationshipStatus, setRelationshipStatus] = useState<string>(contact?.relationshipStatus ?? 'active')
  const [isChampion, setIsChampion]             = useState(contact?.isChampion ?? false)
  const [notes, setNotes]                       = useState(contact?.notes ?? '')
  const [saving, setSaving]                     = useState(false)
  const [error, setError]                       = useState('')

  // Derive champion from roleType during render instead of syncing via effect
  const derivedIsChampion = roleType === 'champion'
  if (isChampion !== derivedIsChampion) {
    setIsChampion(derivedIsChampion)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setSaving(true); setError('')

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      title: title.trim() || null,
      phone: phone.trim() || null,
      roleType,
      influenceLevel,
      relationshipStatus,
      isChampion,
      isDecisionMaker: roleType === 'decision_maker',
      notes: notes.trim() || null,
    }

    try {
      const url = isEdit
        ? `/api/accounts/${accountId}/contacts/${contact.id}`
        : `/api/accounts/${accountId}/contacts`

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) { setError('Error al guardar. Intenta de nuevo.'); setSaving(false); return }

      const saved: Contact = await res.json()
      onSaved(saved)
    } catch {
      setError('Error de conexión.')
      setSaving(false)
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  const pillClass = (active: boolean) =>
    `h-7 px-2.5 rounded-lg text-xs font-medium transition-colors min-w-0 ${
      active
        ? 'bg-[#EEF1FE] text-[#4F6EF7]'
        : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
    }`

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-[14px] border border-[#ECEEF5] w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEEF5]">
          <h2 className="text-sm font-semibold text-[#0F1117]">
            {isEdit ? 'Editar stakeholder' : 'Nuevo stakeholder'}
          </h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name + Title row */}
          <div className="grid grid-cols-2 gap-3">
            <TextField value={name} onChange={setName} isRequired className="w-full">
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Nombre *</Label>
              <Input
                placeholder="Juan García"
                autoFocus
                className="w-full h-9 px-3 border border-[#ECEEF5] rounded-lg text-sm text-[#0F1117] bg-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#9CA3AF]"
              />
            </TextField>
            <TextField value={title} onChange={setTitle} className="w-full">
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Cargo</Label>
              <Input
                placeholder="CTO"
                className="w-full h-9 px-3 border border-[#ECEEF5] rounded-lg text-sm text-[#0F1117] bg-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#9CA3AF]"
              />
            </TextField>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <TextField value={email} onChange={setEmail} type="email" className="w-full">
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Email</Label>
              <Input
                placeholder="juan@empresa.com"
                className="w-full h-9 px-3 border border-[#ECEEF5] rounded-lg text-sm text-[#0F1117] bg-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#9CA3AF]"
              />
            </TextField>
            <TextField value={phone} onChange={setPhone} className="w-full">
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Teléfono</Label>
              <Input
                placeholder="+52 55 1234 5678"
                className="w-full h-9 px-3 border border-[#ECEEF5] rounded-lg text-sm text-[#0F1117] bg-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#9CA3AF]"
              />
            </TextField>
          </div>

          {/* Role type pills */}
          <div>
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Tipo de rol</p>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_TYPES.map(rt => (
                <Button
                  key={rt}
                  type="button"
                  size="sm"
                 
                  onPress={() => setRoleType(rt)}
                  className={pillClass(roleType === rt)}
                >
                  {ROLE_TYPE_LABELS[rt]}
                </Button>
              ))}
            </div>
          </div>

          {/* Influence + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Nivel de influencia</p>
              <div className="flex gap-1.5">
                {INFLUENCE_LEVELS.map(lvl => (
                  <Button
                    key={lvl}
                    type="button"
                    size="sm"
                   
                    onPress={() => setInfluenceLevel(lvl)}
                    className={`flex-1 h-7 rounded-lg text-xs font-medium transition-colors min-w-0 ${
                      influenceLevel === lvl
                        ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                        : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
                    }`}
                  >
                    {INFLUENCE_LABELS[lvl]}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Estado relación</p>
              <div className="flex flex-wrap gap-1">
                {RELATIONSHIP_STATUSES.map(s => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                   
                    onPress={() => setRelationshipStatus(s)}
                    className={`h-7 px-2 rounded-lg text-xs font-medium transition-colors min-w-0 ${
                      relationshipStatus === s
                        ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                        : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <TextField value={notes} onChange={setNotes} className="w-full">
            <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Notas</Label>
            <TextArea
              placeholder="Contexto sobre este contacto..."
              rows={2}
              className="w-full px-3 py-2 border border-[#ECEEF5] rounded-lg text-sm text-[#0F1117] bg-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#9CA3AF] resize-none"
            />
          </TextField>

          {error && <p className="text-xs text-[#EF4444]">{error}</p>}

          {/* Actions */}
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
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
