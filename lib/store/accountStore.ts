import { create } from 'zustand'
import type { Account } from '@/domain/account/Account'

interface AccountStore {
  selectedAccount: Account | null
  setSelectedAccount: (account: Account | null) => void
}

export const useAccountStore = create<AccountStore>((set) => ({
  selectedAccount: null,
  setSelectedAccount: (account) => set({ selectedAccount: account }),
}))
