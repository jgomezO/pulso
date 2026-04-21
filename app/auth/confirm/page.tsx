'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface EnsureOrgResult {
  orgId: string | null
  needsOnboarding?: boolean
}

async function ensureOrg(): Promise<EnsureOrgResult> {
  const res = await fetch('/api/auth/ensure-org', { method: 'POST' })
  if (!res.ok) return { orgId: null }
  return await res.json() as EnsureOrgResult
}

/**
 * Handles Supabase email confirmations and invites.
 * Tokens arrive in the URL hash fragment (#access_token=...)
 * which only client-side JS can read.
 */
export default function AuthConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Verificando autenticación...')

  useEffect(() => {
    async function handleAuth() {
      const supabase = createClient()

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setStatus('Error de autenticación. Redirigiendo...')
        setTimeout(() => router.replace('/login?error=auth'), 1500)
        return
      }

      if (session) {
        setStatus('Sesión detectada. Configurando...')
        const result = await ensureOrg()
        router.replace(result.needsOnboarding ? '/onboarding' : '/')
        return
      }

      // No session and no hash — maybe the hash was already consumed
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (event === 'SIGNED_IN' && newSession) {
            setStatus('Sesión iniciada. Configurando...')
            const result = await ensureOrg()
            subscription.unsubscribe()
            router.replace(result.needsOnboarding ? '/onboarding' : '/')
          }
        }
      )

      // Timeout fallback
      setTimeout(() => {
        subscription.unsubscribe()
        router.replace('/login?error=auth')
      }, 5000)
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC]">
      <div className="text-center">
        <div className="w-10 h-10 bg-[#4F6EF7] rounded-[14px] flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <p className="text-sm text-[#9CA3AF]">{status}</p>
      </div>
    </div>
  )
}
