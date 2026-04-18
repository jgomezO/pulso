import { streamAccountSummary } from '@/infrastructure/ai/AccountSummarizer'
import type { AccountSummaryContext } from '@/infrastructure/ai/prompts/account-summary.prompt'
import type { AccountRepository } from '@/domain/account/AccountRepository'
import type { EventRepository } from '@/domain/event/EventRepository'
import { formatCurrency } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/date'

export class GenerateAccountSummary {
  constructor(
    private accountRepo: AccountRepository,
    private eventRepo: EventRepository
  ) {}

  async execute(accountId: string, orgId: string): Promise<ReadableStream<Uint8Array>> {
    const account = await this.accountRepo.findById(accountId, orgId)
    if (!account) throw new Error('Account not found')

    const recentEvents = await this.eventRepo.findByAccountId(accountId, 10)
    const openTickets = recentEvents.filter(
      (e) => e.type === 'ticket' && e.metadata?.status === 'open'
    ).length

    const context: AccountSummaryContext = {
      name: account.name,
      arr: formatCurrency(account.arr),
      healthScore: account.healthScore ?? 0,
      trend: account.healthTrend ?? 'stable',
      renewalDate: formatDate(account.renewalDate),
      recentEvents: recentEvents.slice(0, 5).map((e) => ({
        type: e.type,
        title: e.title ?? e.type,
        occurredAt: formatDate(e.occurredAt),
      })),
      openTickets,
      usageSummary: 'No disponible',
    }

    const stream = await streamAccountSummary(context)

    // Save to cache after streaming (fire and forget)
    this.cacheSummary(accountId, context).catch(console.error)

    return stream
  }

  private async cacheSummary(accountId: string, context: AccountSummaryContext): Promise<void> {
    // We'll let the route handler cache it once the full response is built
    void context
    void accountId
  }
}
