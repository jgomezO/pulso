import { createServiceClient } from './supabase'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import type { Contact, CreateContactInput } from '@/domain/contact/Contact'

function toContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    name: row.name as string,
    email: row.email as string | null,
    title: row.title as string | null,
    phone: row.phone as string | null,
    role: row.role as string | null,
    roleType: (row.role_type as Contact['roleType']) ?? 'user',
    influenceLevel: (row.influence_level as Contact['influenceLevel']) ?? 'medium',
    relationshipStatus: (row.relationship_status as Contact['relationshipStatus']) ?? 'active',
    isChampion: row.is_champion as boolean,
    isDecisionMaker: row.is_decision_maker as boolean,
    notes: row.notes as string | null,
    avatarUrl: row.avatar_url as string | null,
    lastContactedAt: row.last_contacted_at as string | null,
    lastActivityAt: row.last_activity_at as string | null,
    engagementScore: row.engagement_score as number | null,
    hubspotId: row.hubspot_id as string | null,
    createdAt: row.created_at as string,
  }
}

export class ContactRepositorySupabase implements ContactRepository {
  private get db() {
    return createServiceClient()
  }

  async findByAccountId(accountId: string): Promise<Contact[]> {
    const { data, error } = await this.db
      .from('contacts')
      .select('*')
      .eq('account_id', accountId)
      .is('deleted_at', null)
      .order('is_champion', { ascending: false })
      .order('is_decision_maker', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(toContact)
  }

  async findById(id: string): Promise<Contact | null> {
    const { data, error } = await this.db
      .from('contacts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !data) return null
    return toContact(data)
  }

  async create(input: CreateContactInput): Promise<Contact> {
    // If creating a champion, unset any existing champion first
    if (input.isChampion) {
      await this.db
        .from('contacts')
        .update({ is_champion: false })
        .eq('account_id', input.accountId)
        .eq('is_champion', true)
        .is('deleted_at', null)
    }

    const { data, error } = await this.db
      .from('contacts')
      .insert({
        account_id: input.accountId,
        name: input.name,
        email: input.email ?? null,
        title: input.title ?? null,
        phone: input.phone ?? null,
        role: input.role ?? null,
        role_type: input.roleType ?? 'user',
        influence_level: input.influenceLevel ?? 'medium',
        relationship_status: input.relationshipStatus ?? 'active',
        is_champion: input.isChampion ?? false,
        is_decision_maker: input.isDecisionMaker ?? false,
        notes: input.notes ?? null,
        avatar_url: input.avatarUrl ?? null,
        last_contacted_at: input.lastContactedAt ?? null,
        engagement_score: input.engagementScore ?? null,
        hubspot_id: input.hubspotId ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return toContact(data)
  }

  async update(id: string, input: Partial<CreateContactInput>): Promise<Contact> {
    // If setting as champion, unset any existing champion for this account first
    if (input.isChampion === true) {
      const existing = await this.findById(id)
      if (existing) {
        await this.db
          .from('contacts')
          .update({ is_champion: false })
          .eq('account_id', existing.accountId)
          .eq('is_champion', true)
          .neq('id', id)
          .is('deleted_at', null)
      }
    }

    const updates: Record<string, unknown> = {}
    if (input.name                !== undefined) updates.name                = input.name
    if (input.email               !== undefined) updates.email               = input.email
    if (input.title               !== undefined) updates.title               = input.title
    if (input.phone               !== undefined) updates.phone               = input.phone
    if (input.role                !== undefined) updates.role                = input.role
    if (input.roleType            !== undefined) updates.role_type           = input.roleType
    if (input.influenceLevel      !== undefined) updates.influence_level     = input.influenceLevel
    if (input.relationshipStatus  !== undefined) updates.relationship_status = input.relationshipStatus
    if (input.isChampion          !== undefined) updates.is_champion         = input.isChampion
    if (input.isDecisionMaker     !== undefined) updates.is_decision_maker   = input.isDecisionMaker
    if (input.notes               !== undefined) updates.notes               = input.notes
    if (input.avatarUrl           !== undefined) updates.avatar_url          = input.avatarUrl
    if (input.lastContactedAt     !== undefined) updates.last_contacted_at   = input.lastContactedAt
    if (input.engagementScore     !== undefined) updates.engagement_score    = input.engagementScore

    const { data, error } = await this.db
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toContact(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }
}
