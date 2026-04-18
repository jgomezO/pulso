'use client'

import { useState, useEffect } from 'react'

interface UserProfile {
  orgName: string
  role: string
}

interface UseUserProfileReturn {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (!res.ok) {
          if (!cancelled) setError('No se pudo cargar el perfil')
          return
        }
        const data = (await res.json()) as UserProfile
        if (!cancelled) setProfile(data)
      } catch {
        if (!cancelled) setError('Error de conexión')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [])

  return { profile, isLoading, error }
}
