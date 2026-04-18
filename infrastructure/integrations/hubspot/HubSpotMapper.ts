import type { CreateAccountEventInput } from '@/domain/event/AccountEvent'
import type { CreateContactInput } from '@/domain/contact/Contact'

export interface HubSpotContact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    jobtitle?: string
  }
}

export interface HubSpotEngagement {
  id: string
  engagement: {
    type: string
    timestamp: number
  }
  metadata: {
    subject?: string
    body?: string
  }
}

export function mapHubSpotContactToDomain(
  contact: HubSpotContact,
  accountId: string
): CreateContactInput {
  const name = [contact.properties.firstname, contact.properties.lastname]
    .filter(Boolean)
    .join(' ') || 'Unknown'

  return {
    accountId,
    name,
    email: contact.properties.email ?? null,
    role: contact.properties.jobtitle ?? null,
    roleType: 'user',
    influenceLevel: 'medium',
    relationshipStatus: 'active',
    isChampion: false,
    isDecisionMaker: false,
    hubspotId: contact.id,
  }
}

export function mapHubSpotEngagementToEvent(
  engagement: HubSpotEngagement,
  accountId: string
): CreateAccountEventInput {
  return {
    accountId,
    type: engagement.engagement.type === 'MEETING' ? 'meeting' : 'email',
    source: 'hubspot',
    title: engagement.metadata.subject ?? null,
    description: engagement.metadata.body ?? null,
    occurredAt: new Date(engagement.engagement.timestamp).toISOString(),
  }
}
