'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Table } from '@heroui/react'
import type { Account } from '@/domain/account/Account'
import { formatCurrency } from '@/lib/utils/format'
import { daysUntil, formatDate } from '@/lib/utils/date'
import { Icon } from '@/components/shared/Icon'
import { IconTrendUp, IconTrendDown, IconTrendStable } from '@/lib/icons'

interface AccountTableProps {
  accounts: Account[]
  isLoading?: boolean
  onArchive?: (id: string) => void
}

const TIER_COLOR: Record<string, string> = {
  enterprise: 'bg-[#F0EEFF] text-[#6C4EF2]',
  growth:     'bg-[#EEF1FE] text-[#4F6EF7]',
  starter:    'bg-[#F7F8FC] text-[#6B7280]',
  other:      'bg-[#F7F8FC] text-[#6B7280]',
}

const TREND_CONFIG = {
  improving: { icon: IconTrendUp,     color: 'text-[#22C55E]', label: 'Mejorando' },
  declining: { icon: IconTrendDown,   color: 'text-[#EF4444]', label: 'Declinando' },
  stable:    { icon: IconTrendStable, color: 'text-[#9CA3AF]', label: 'Estable' },
}

export function AccountTable({ accounts, isLoading, onArchive }: AccountTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [sortKey,  setSortKey]  = useState<'trend' | null>(null)

  if (isLoading) {
    return (
      <div className="border border-[#ECEEF5] rounded-[14px] p-8 text-center text-sm text-[#9CA3AF] bg-white">
        Cargando cuentas...
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="border border-[#ECEEF5] rounded-[14px] p-8 text-center text-sm text-[#9CA3AF] bg-white">
        No se encontraron cuentas
      </div>
    )
  }

  const sorted = sortKey === 'trend'
    ? [...accounts].sort((a, b) => {
        const order = { declining: 0, stable: 1, improving: 2 }
        return (order[a.healthTrend ?? 'stable'] ?? 1) - (order[b.healthTrend ?? 'stable'] ?? 1)
      })
    : accounts

  return (
    <div className="border border-[#ECEEF5] rounded-[14px] overflow-hidden bg-white">
      <Table.Root>
        <Table.Content aria-label="Accounts table">
        <Table.Header>
          <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Cuenta</Table.Column>
          <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Tier</Table.Column>
          <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">ARR</Table.Column>
          <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Score</Table.Column>
          <Table.Column
            className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:text-[#4F6EF7] select-none border-b border-[#ECEEF5]"
            onClick={() => setSortKey(sortKey === 'trend' ? null : 'trend')}
          >
            Tendencia {sortKey === 'trend' && <Icon icon={IconTrendUp} size={12} />}
          </Table.Column>
          <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Riesgo</Table.Column>
          <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Renovación</Table.Column>
          <Table.Column className="px-4 py-3 border-b border-[#ECEEF5]">{' '}</Table.Column>
        </Table.Header>
        <Table.Body>
          {sorted.map(account => (
            <Table.Row
              key={account.id}
              className="border-b border-[#ECEEF5] last:border-0 hover:bg-[#F7F8FC] transition-colors"
            >
              {/* Name */}
              <Table.Cell className="px-4 py-3">
                <Link href={`/accounts/${account.id}`} className="block">
                  <p className="text-sm font-medium text-[#0F1117] hover:text-[#4F6EF7] transition-colors">{account.name}</p>
                  {account.domain && <p className="text-xs text-[#9CA3AF]">{account.domain}</p>}
                </Link>
              </Table.Cell>

              {/* Tier */}
              <Table.Cell className="px-4 py-3">
                {account.tier ? (
                  <span className={`text-xs px-2 py-0.5 rounded-md capitalize font-medium ${TIER_COLOR[account.tier] ?? 'bg-[#F7F8FC] text-[#6B7280]'}`}>
                    {account.tier}
                  </span>
                ) : <span className="text-[#9CA3AF] text-sm">—</span>}
              </Table.Cell>

              {/* ARR */}
              <Table.Cell className="px-4 py-3">
                <span className="text-sm font-medium text-[#0F1117]">{formatCurrency(account.arr)}</span>
              </Table.Cell>

              {/* Score */}
              <Table.Cell className="px-4 py-3">
                {(() => {
                  const s = account.healthScore
                  if (s == null) return <span className="text-[#9CA3AF] text-sm">—</span>
                  const style = s >= 70 ? 'bg-[#E8FAF0] text-[#22C55E]' : s >= 40 ? 'bg-[#FEF3E8] text-[#F58C37]' : 'bg-[#FEE8E8] text-[#EF4444]'
                  return <span className={`text-xs font-bold px-2 py-1 rounded-md ${style}`}>{s}</span>
                })()}
              </Table.Cell>

              {/* Trend */}
              <Table.Cell className="px-4 py-3">
                {account.healthTrend ? (() => {
                  const t = TREND_CONFIG[account.healthTrend as keyof typeof TREND_CONFIG] ?? TREND_CONFIG.stable
                  return (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${t.color}`}>
                      <Icon icon={t.icon} size={12} /> {t.label}
                    </span>
                  )
                })() : <span className="text-[#9CA3AF] text-sm">—</span>}
              </Table.Cell>

              {/* Risk */}
              <Table.Cell className="px-4 py-3">
                {account.riskLevel ? (() => {
                  const riskStyle =
                    account.riskLevel === 'critical' ? 'bg-[#FEE8E8] text-[#EF4444]'
                    : account.riskLevel === 'high'    ? 'bg-[#FEF3E8] text-[#F58C37]'
                    : account.riskLevel === 'medium'  ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                    : 'bg-[#E8FAF0] text-[#22C55E]'
                  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${riskStyle}`}>{account.riskLevel}</span>
                })() : <span className="text-[#9CA3AF] text-sm">—</span>}
              </Table.Cell>

              {/* Renewal */}
              <Table.Cell className="px-4 py-3">
                {account.renewalDate ? (
                  <div>
                    <p className="text-sm text-[#6B7280]">{formatDate(account.renewalDate)}</p>
                    {(() => {
                      const days = daysUntil(account.renewalDate)
                      if (days !== null && days <= 90) return <p className="text-xs text-[#F58C37]">en {days}d</p>
                      return null
                    })()}
                  </div>
                ) : <span className="text-[#9CA3AF] text-sm">—</span>}
              </Table.Cell>

              {/* Actions */}
              <Table.Cell className="px-4 py-3">
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                   
                    onPress={() => setOpenMenu(openMenu === account.id ? null : account.id)}
                    className="w-7 h-7 min-w-0 rounded-lg text-[#9CA3AF] hover:bg-[#F7F8FC] hover:text-[#6B7280] transition-colors text-base leading-none"
                  >
                    ···
                  </Button>
                  {openMenu === account.id && (
                    <div className="absolute right-0 top-8 z-10 bg-white border border-[#ECEEF5] rounded-xl py-1 min-w-[140px]">
                      <Link
                        href={`/accounts/${account.id}/edit`}
                        onClick={() => setOpenMenu(null)}
                        className="block w-full text-left px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F7F8FC]"
                      >
                        Editar
                      </Link>
                      <Button
                        variant="ghost"
                       
                        onPress={() => { setOpenMenu(null); onArchive?.(account.id) }}
                        className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-[#FEE8E8] rounded-none justify-start h-auto min-w-0"
                      >
                        Archivar
                      </Button>
                    </div>
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        </Table.Content>
      </Table.Root>
    </div>
  )
}
