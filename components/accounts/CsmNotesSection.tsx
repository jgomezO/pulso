'use client'

import { useState, useEffect, useRef } from 'react'
import { TextField, TextArea } from '@heroui/react'

interface CsmNotesSectionProps {
  accountId: string
  initialNotes: string | null
}

export function CsmNotesSection({ accountId, initialNotes }: CsmNotesSectionProps) {
  const [notes,  setNotes]  = useState(initialNotes ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Sync local notes state when the prop changes from the server
    const handler = () => setNotes(initialNotes ?? '')
    handler()
  }, [initialNotes])

  function handleChange(value: string) {
    setNotes(value)
    setStatus('idle')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(value), 1200)
  }

  async function save(value: string) {
    setStatus('saving')
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csmNotes: value }),
    })
    setStatus(res.ok ? 'saved' : 'error')
    if (res.ok) setTimeout(() => setStatus('idle'), 2000)
  }

  const statusLabel =
    status === 'saving' ? 'Guardando...' :
    status === 'saved'  ? 'Guardado'     :
    status === 'error'  ? 'Error al guardar' : undefined

  const statusColor =
    status === 'saved'  ? 'text-green-500' :
    status === 'error'  ? 'text-red-500'   : 'text-gray-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700">Notas del CSM</h2>
        {statusLabel && (
          <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
        )}
      </div>
      <TextField value={notes} onChange={handleChange} className="w-full">
        <TextArea
          placeholder="Escribe observaciones internas sobre esta cuenta..."
          rows={5}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </TextField>
    </div>
  )
}
