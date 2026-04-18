import type { AccountRepository } from '@/domain/account/AccountRepository'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import type { EventRepository } from '@/domain/event/EventRepository'
import type { Account } from '@/domain/account/Account'
import type { Contact } from '@/domain/contact/Contact'
import type { AccountEvent } from '@/domain/event/AccountEvent'

export interface AccountOverview {
  account: Account
  contacts: Contact[]
  recentEvents: AccountEvent[]
  openTicketsCount: number
}

export class GetAccountOverview {
  constructor(
    private accountRepo: AccountRepository,
    private contactRepo: ContactRepository,
    private eventRepo: EventRepository
  ) {}

  async execute(accountId: string, orgId: string): Promise<AccountOverview | null> {
    const account = await this.accountRepo.findById(accountId, orgId)
    if (!account) return null

    const [contacts, recentEvents] = await Promise.all([
      this.contactRepo.findByAccountId(accountId),
      this.eventRepo.findByAccountId(accountId, 30),
    ])

    const openTicketsCount = recentEvents.filter(
      (e) => e.type === 'ticket' && e.metadata?.status === 'open'
    ).length

    return { account, contacts, recentEvents, openTicketsCount }
  }
}
