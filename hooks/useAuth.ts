'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface EnsureOrgResult {
  orgId: string | null
  needsOnboarding?: boolean
}

export interface UseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  orgId: string | null
  needsOnboarding: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  setOrgId: (id: string) => void
}

async function fetchEnsureOrg(): Promise<EnsureOrgResult> {
  try {
    const res = await fetch('/api/auth/ensure-org', { method: 'POST' })
    if (!res.ok) return { orgId: null }
    const data = await res.json() as EnsureOrgResult
    return data
  } catch {
    return { orgId: null }
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const ensuredRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user && !ensuredRef.current) {
        ensuredRef.current = true
        const result = await fetchEnsureOrg()
        setOrgId(result.orgId)
        setNeedsOnboarding(result.needsOnboarding === true)
      }

      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (event === 'SIGNED_IN' && newSession?.user && !ensuredRef.current) {
        ensuredRef.current = true
        const result = await fetchEnsureOrg()
        setOrgId(result.orgId)
        setNeedsOnboarding(result.needsOnboarding === true)
      }

      if (event === 'SIGNED_OUT') {
        setOrgId(null)
        setNeedsOnboarding(false)
        ensuredRef.current = false
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [])

  const handleSetOrgId = useCallback((id: string) => {
    setOrgId(id)
    setNeedsOnboarding(false)
  }, [])

  return { user, session, loading, orgId, needsOnboarding, signInWithGoogle, signOut, setOrgId: handleSetOrgId }
}
