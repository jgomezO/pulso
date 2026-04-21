'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, Input, Label, Button } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconCompany } from '@/lib/icons'
import { useAuthContext } from '@/components/providers/AuthProvider'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, setOrgId } = useAuthContext()
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const userName = (user?.user_metadata?.full_name as string | undefined) ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmed = orgName.trim()
    if (trimmed.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Error al crear la organización')
        return
      }

      const data = await res.json() as { orgId: string }
      setOrgId(data.orgId)
      router.replace('/')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm bg-white border border-[#ECEEF5] rounded-[14px] p-10">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 bg-[#4F6EF7] rounded-[14px] flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-2xl font-bold text-[#4F6EF7]">Pulso</span>
        </div>
        {userName && (
          <p className="text-sm text-[#6B7280]">
            Bienvenido, {userName.split(' ')[0]}
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-base font-semibold text-[#0F1117] mb-1">
            Crea tu organización
          </p>
          <p className="text-sm text-[#9CA3AF] mb-4">
            Este será el espacio de trabajo de tu equipo.
          </p>

          <TextField
            value={orgName}
            onChange={setOrgName}
            isRequired
            isInvalid={!!error}
            className="w-full"
          >
            <Label className="block text-sm font-medium text-[#0F1117] mb-1">
              Nombre de la organización
            </Label>
            <div className="flex items-center gap-2 h-11 px-3 border border-[#ECEEF5] rounded-xl focus-within:border-[#4F6EF7] transition-colors">
              <Icon icon={IconCompany} size={16} className="text-[#9CA3AF] shrink-0" />
              <Input
                placeholder="Ej: Acme Corp"
                className="h-full text-sm bg-transparent border-none focus:ring-0 focus:outline-none w-full"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-[#EF4444] mt-1">{error}</p>
            )}
          </TextField>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11 rounded-xl font-medium"
          isDisabled={submitting}
        >
          {submitting ? 'Creando...' : 'Continuar'}
        </Button>
      </form>
    </div>
  )
}
