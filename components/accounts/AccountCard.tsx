import { Card, Chip } from '@heroui/react'
import Link from 'next/link'
import type { Account } from '@/domain/account/Account'
import { HealthScoreBadge } from './HealthScoreBadge'
import { formatCurrency } from '@/lib/utils/format'
import { daysUntil, formatDate } from '@/lib/utils/date'

interface AccountCardProps {
  account: Account
}

const RISK_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

export function AccountCard({ account }: AccountCardProps) {
  const renewalDays = daysUntil(account.renewalDate)

  return (
    <Link href={`/accounts/${account.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <Card.Content className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 truncate max-w-[200px]">
                {account.name}
              </h3>
              {account.domain && (
                <p className="text-xs text-gray-500">{account.domain}</p>
              )}
            </div>
            <HealthScoreBadge
              score={account.healthScore}
              showTrend
              trend={account.healthTrend}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {account.arr != null && (
              <span className="text-sm text-gray-600 font-medium">
                {formatCurrency(account.arr)}
              </span>
            )}
            {account.tier && (
              <Chip size="sm" variant="secondary" color="default" className="capitalize">
                {account.tier}
              </Chip>
            )}
            {account.riskLevel && (
              <Chip
                size="sm"
                color={RISK_COLOR[account.riskLevel] ?? 'default'}
                variant="soft"
                className="capitalize"
              >
                {account.riskLevel}
              </Chip>
            )}
          </div>

          {renewalDays !== null && renewalDays <= 90 && (
            <p className="text-xs text-amber-600 mt-2">
              Renovación en {renewalDays} días ({formatDate(account.renewalDate)})
            </p>
          )}
        </Card.Content>
      </Card>
    </Link>
  )
}
