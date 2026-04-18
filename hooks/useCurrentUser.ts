import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useCurrentUser() {
  const [userId,    setUserId]    = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setIsLoading(false)
    })
  }, [])

  return { userId, isLoading }
}
