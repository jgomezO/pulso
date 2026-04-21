'use client'

import { useState, useCallback } from 'react'

export function useAccountSummary(accountId: string) {
  const [summary, setSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setSummary('')
    setError(null)
    setIsGenerating(true)

    try {
      const response = await fetch(`/api/accounts/${accountId}/summary`)

      if (!response.ok) {
        throw new Error('Error generating summary')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
      }

      setSummary(buffer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsGenerating(false)
    }
  }, [accountId])

  return { summary, isGenerating, error, generate }
}
