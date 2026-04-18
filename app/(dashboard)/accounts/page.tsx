'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Button, TextField, Input } from '@heroui/react'
import { AccountTable } from '@/components/accounts/AccountTable'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency } from '@/lib/utils/format'
import { daysUntil } from '@/lib/utils/date'
import type { Account } from '@/domain/account/Account'

interface AccountsResponse {
  data: Account[]
  total: number
  page: number
  pageSize: number
}

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? 'demo-org-id'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type QuickFilter = 'all' | 'at-risk' | 'declining' | 'renewing'
type TierFilter  = '' | 'enterprise' | 'growth' | 'starter' | 'other'

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'all',      label: 'Todas'                  },
  { value: 'at-risk',  label: 'En riesgo (score < 40)' },
  { value: 'declining', label: 'Declinando'             },
  { value: 'renewing', label: 'Renovaciones próximas'  },
]

const TIER_FILTERS: { value: TierFilter; label: string }[] = [
  { value: '',           label: 'Todos'       },
  { value: 'enterprise', label: 'Enterprise'  },
  { value: 'growth',     label: 'Growth'      },
  { value: 'starter',    label: 'Starter'     },
]

export default function AccountsPage() {
  const [search,       setSearch]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [quickFilter,  setQuickFilter]  = useState<QuickFilter>('all')
  const [tierFilter,   setTierFilter]   = useState<TierFilter>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

  // Always fetch all (no server-side quick-filter) — we filter client-side
  const params = new URLSearchParams({ orgId: ORG_ID, pageSize: '100' })
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (tierFilter)      params.set('tier', tierFilter)

  const { data, isLoading, mutate } = useSWR<AccountsResponse>(
    `/api/accounts?${params.toString()}`,
    fetcher
  )

  const allAccounts = data?.data ?? []

  // Apply quick filter client-side
  const filtered = allAccounts.filter(a => {
    if (quickFilter === 'at-risk')  return (a.healthScore ?? 100) < 40
    if (quickFilter === 'declining') return a.healthTrend === 'declining'
    if (quickFilter === 'renewing') {
      if (!a.renewalDate) return false
      const days = daysUntil(a.renewalDate)
      return days !== null && days >= 0 && days <= 90
    }
    return true
  })

  const totalArr = filtered.reduce((sum, a) => sum + (a.arr ?? 0), 0)

  async function handleArchive(id: string) {
    await fetch(`/api/accounts/${id}?orgId=${ORG_ID}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <div>
      <div className="space-y-4">
        {/* Quick filter tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {QUICK_FILTERS.map(f => (
            <Button
              key={f.value}
              size="sm"
             
              onPress={() => setQuickFilter(f.value)}
              className={`h-8 px-3 rounded-xl text-xs font-medium transition-colors min-w-0 ${
                quickFilter === f.value
                  ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                  : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
              }`}
            >
              {f.label}
              {!isLoading && f.value !== 'all' && (() => {
                const count = f.value === 'at-risk'
                  ? allAccounts.filter(a => (a.healthScore ?? 100) < 40).length
                  : f.value === 'declining'
                    ? allAccounts.filter(a => a.healthTrend === 'declining').length
                    : allAccounts.filter(a => {
                        if (!a.renewalDate) return false
                        const d = daysUntil(a.renewalDate)
                        return d !== null && d >= 0 && d <= 90
                      }).length
                return count > 0 ? <span className="ml-1.5 text-[10px] bg-current/10 px-1 rounded-md">{count}</span> : null
              })()}
            </Button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF] pointer-events-none z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <TextField value={search} onChange={handleSearchChange} className="w-52">
              <Input
                placeholder="Buscar cuenta..."
                className="h-9 bg-white border border-[#ECEEF5] rounded-xl pl-8 pr-3 text-sm text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4F6EF7] transition-colors"
              />
            </TextField>
          </div>

          <div className="flex gap-1 items-center">
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mr-1">Tier</span>
            {TIER_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
               
                onPress={() => setTierFilter(f.value)}
                className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-colors min-w-0 ${
                  tierFilter === f.value
                    ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                    : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
                }`}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Summary */}
            {!isLoading && (
              <p className="text-xs text-[#9CA3AF]">
                <span className="font-semibold text-[#0F1117]">{filtered.length}</span> cuentas
                {totalArr > 0 && (
                  <> · ARR total: <span className="font-semibold text-[#0F1117]">{formatCurrency(totalArr)}</span></>
                )}
              </p>
            )}
            <Link href="/accounts/import">
              <Button className="h-9 px-4 bg-white border border-[#ECEEF5] text-[#6B7280] rounded-xl text-sm font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors min-w-0">
                Importar CSV
              </Button>
            </Link>
            <Link href="/accounts/new">
              <Button className="h-9 px-4 bg-[#4F6EF7] text-white rounded-xl text-sm font-medium hover:bg-[#4060E8] transition-colors min-w-0">
                + Nueva cuenta
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : (
          <AccountTable accounts={filtered} onArchive={handleArchive} />
        )}
      </div>
    </div>
  )
}
