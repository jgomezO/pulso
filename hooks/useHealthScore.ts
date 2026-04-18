import useSWR from 'swr'

interface HealthScoreHistory {
  id: string
  account_id: string
  score: number
  signals: Record<string, number | null>
  ai_explanation: string | null
  calculated_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useHealthScore(accountId: string) {
  const { data, error, isLoading } = useSWR<{ history: HealthScoreHistory[] }>(
    accountId ? `/api/accounts/${accountId}/health` : null,
    fetcher
  )

  const latest = data?.history?.[0] ?? null
  const previous = data?.history?.[1] ?? null

  return {
    latest,
    previous,
    history: data?.history ?? [],
    isLoading,
    error,
  }
}
