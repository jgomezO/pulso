import type { CreateAccountEventInput } from '@/domain/event/AccountEvent'

export interface IntercomConversation {
  id: string
  created_at: number
  updated_at: number
  subject?: string
  state: 'open' | 'closed' | 'snoozed'
  priority: 'priority' | 'not_priority'
  source: {
    body: string
  }
  statistics?: {
    first_response_time?: number
  }
}

export function mapIntercomConversationToEvent(
  conversation: IntercomConversation,
  accountId: string
): CreateAccountEventInput {
  return {
    accountId,
    type: 'ticket',
    source: 'intercom',
    title: conversation.subject ?? 'Ticket de soporte',
    description: conversation.source.body,
    sentiment: conversation.priority === 'priority' ? 'negative' : 'neutral',
    metadata: {
      status: conversation.state,
      priority: conversation.priority,
      intercomId: conversation.id,
    },
    occurredAt: new Date(conversation.created_at * 1000).toISOString(),
  }
}
