'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from '@/hooks/useAccount'
import { AccountForm } from '@/components/accounts/AccountForm'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import type { Account } from '@/domain/account/Account'

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? ''

export default function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { account, isLoading } = useAccount(id, ORG_ID)

  if (isLoading) return <PageSkeleton />
  if (!account) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cuenta no encontrada.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-2xl">
        <AccountForm
          account={account}
          onSuccess={(updated: Account) => router.push(`/accounts/${updated.id}`)}
        />
      </div>
    </div>
  )
}
