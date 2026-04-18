import { create } from 'zustand'
import type { Account } from '@/domain/account/Account'

interface AccountStore {
  selectedAccount: Account | null
  setSelectedAccount: (account: Account | null) => void
  orgId: string
  setOrgId: (orgId: string) => void
}

export const useAccountStore = create<AccountStore>((set) => ({
  selectedAccount: null,
  setSelectedAccount: (account) => set({ selectedAccount: account }),
  orgId: process.env.NEXT_PUBLIC_ORG_ID ?? '',
  setOrgId: (orgId) => set({ orgId }),
}))
