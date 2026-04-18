'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  orgId: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

async function fetchEnsureOrg(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/ensure-org', { method: 'POST' })
    if (!res.ok) return null
    const data = await res.json() as { orgId: string }
    return data.orgId
  } catch {
    return null
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const ensuredRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user && !ensuredRef.current) {
        ensuredRef.current = true
        const id = await fetchEnsureOrg()
        setOrgId(id)
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
        const id = await fetchEnsureOrg()
        setOrgId(id)
      }

      if (event === 'SIGNED_OUT') {
        setOrgId(null)
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

  return { user, session, loading, orgId, signInWithGoogle, signOut }
}
