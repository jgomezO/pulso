import useSWR from 'swr'
import type { AccountEvent } from '@/domain/event/AccountEvent'

interface TimelineResponse {
  events: AccountEvent[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useTimeline(
  accountId: string,
  options?: { types?: string[]; fromDate?: string; toDate?: string }
) {
  const params = new URLSearchParams()
  if (options?.types?.length) params.set('types', options.types.join(','))
  if (options?.fromDate) params.set('fromDate', options.fromDate)
  if (options?.toDate) params.set('toDate', options.toDate)

  const qs = params.toString()
  const url = accountId
    ? `/api/accounts/${accountId}/timeline${qs ? `?${qs}` : ''}`
    : null

  const { data, error, isLoading } = useSWR<TimelineResponse>(url, fetcher)

  return {
    events: data?.events ?? [],
    isLoading,
    error,
  }
}
