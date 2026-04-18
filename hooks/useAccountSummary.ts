'use client'

import { useState, useCallback } from 'react'

export function useAccountSummary(accountId: string, orgId: string) {
  const [summary, setSummary] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setSummary('')
    setError(null)
    setIsStreaming(true)

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/summary?orgId=${orgId}`
      )

      if (!response.ok) {
        throw new Error('Error generating summary')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setSummary((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsStreaming(false)
    }
  }, [accountId, orgId])

  return { summary, isStreaming, error, generate }
}
