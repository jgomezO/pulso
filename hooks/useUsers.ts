import useSWR from 'swr'

interface OrgUser {
  id: string
  email: string
  name: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useUsers() {
  const { data, error, isLoading } = useSWR<{ users: OrgUser[] }>(
    '/api/users',
    fetcher
  )

  return {
    users: data?.users ?? [],
    isLoading,
    error,
  }
}
