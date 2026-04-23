'use client'

import { useState, useEffect, useCallback } from 'react'

interface HealthNarrativeData {
  narrative: string | null
  generatedAt: string | null
  score: number | null
  reason?: string
}

export function useHealthNarrative(accountId: string) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNarrative = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }
        setError(null)

        const url = `/api/accounts/${accountId}/health-narrative${refresh ? '?refresh=true' : ''}`
        const res = await fetch(url)

        if (!res.ok) {
          throw new Error('Error al obtener el análisis')
        }

        const data: HealthNarrativeData = await res.json()
        setNarrative(data.narrative)
        setGeneratedAt(data.generatedAt)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [accountId]
  )

  useEffect(() => {
    fetchNarrative()
  }, [fetchNarrative])

  const refresh = useCallback(() => {
    fetchNarrative(true)
  }, [fetchNarrative])

  return { narrative, generatedAt, isLoading, isRefreshing, error, refresh }
}
