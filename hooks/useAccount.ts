import useSWR from 'swr'
import type { AccountOverview } from '@/application/accounts/GetAccountOverview'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAccount(accountId: string) {
  const { data, error, isLoading, mutate } = useSWR<AccountOverview>(
    accountId ? `/api/accounts/${accountId}` : null,
    fetcher
  )

  return {
    account: data?.account,
    contacts: data?.contacts ?? [],
    recentEvents: data?.recentEvents ?? [],
    openTicketsCount: data?.openTicketsCount ?? 0,
    isLoading,
    error,
    mutate,
  }
}
