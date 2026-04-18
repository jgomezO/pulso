'use client'

import { useState } from 'react'
import { Button, Label, FieldError, TextField, Input, Switch } from '@heroui/react'

interface AddContactModalProps {
  accountId: string
  onAdded: () => void
}

export function AddContactModal({ accountId, onAdded }: AddContactModalProps) {
  const [open, setOpen]                       = useState(false)
  const [name, setName]                       = useState('')
  const [email, setEmail]                     = useState('')
  const [role, setRole]                       = useState('')
  const [isChampion, setIsChampion]           = useState(false)
  const [isDecisionMaker, setIsDecisionMaker] = useState(false)
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const [error, setError]                     = useState('')

  function reset() {
    setName(''); setEmail(''); setRole('')
    setIsChampion(false); setIsDecisionMaker(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const res = await fetch(`/api/accounts/${accountId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: email || null,
        role: role || null,
        isChampion,
        isDecisionMaker,
      }),
    })

    setIsSubmitting(false)
    if (!res.ok) { setError('Error al guardar el contacto'); return }

    reset()
    setOpen(false)
    onAdded()
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onPress={() => setOpen(true)}>
        + Añadir contacto
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Nuevo contacto</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField value={name} onChange={setName} isRequired className="w-full">
            <Label className="block text-sm text-gray-600 mb-1">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="María García"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FieldError className="text-xs text-red-500 mt-1" />
          </TextField>

          <TextField value={email} onChange={setEmail} type="email" className="w-full">
            <Label className="block text-sm text-gray-600 mb-1">Email</Label>
            <Input
              placeholder="maria@empresa.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </TextField>

          <TextField value={role} onChange={setRole} className="w-full">
            <Label className="block text-sm text-gray-600 mb-1">Rol</Label>
            <Input
              placeholder="CTO, VP Product..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </TextField>

          <div className="flex gap-6 pt-1">
            <Switch.Root isSelected={isChampion} onChange={setIsChampion} className="flex items-center gap-2 cursor-pointer">
              <Switch.Control className="w-10 h-6 rounded-full bg-gray-300 data-[selected]:bg-blue-600 transition-colors">
                <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow translate-x-1 transition-transform data-[selected]:translate-x-5" />
              </Switch.Control>
              <Switch.Content className="text-sm text-gray-600">Champion</Switch.Content>
            </Switch.Root>

            <Switch.Root isSelected={isDecisionMaker} onChange={setIsDecisionMaker} className="flex items-center gap-2 cursor-pointer">
              <Switch.Control className="w-10 h-6 rounded-full bg-gray-300 data-[selected]:bg-blue-600 transition-colors">
                <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow translate-x-1 transition-transform data-[selected]:translate-x-5" />
              </Switch.Control>
              <Switch.Content className="text-sm text-gray-600">Decision Maker</Switch.Content>
            </Switch.Root>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isDisabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Añadir'}
            </Button>
            <Button type="button" variant="ghost" onPress={() => { reset(); setOpen(false) }} isDisabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
