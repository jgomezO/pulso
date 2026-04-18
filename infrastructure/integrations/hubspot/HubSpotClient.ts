import axios from 'axios'
import type { HubSpotContact, HubSpotEngagement } from './HubSpotMapper'

export class HubSpotClient {
  private readonly baseUrl = 'https://api.hubapi.com'
  private readonly http = axios.create({
    baseURL: this.baseUrl,
    headers: {
      Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  async getContacts(accountId: string): Promise<HubSpotContact[]> {
    const { data } = await this.http.get(`/crm/v3/objects/contacts`, {
      params: {
        properties: 'firstname,lastname,email,jobtitle',
        associations: `company:${accountId}`,
      },
    })
    return data.results ?? []
  }

  async getEngagements(companyId: string): Promise<HubSpotEngagement[]> {
    const { data } = await this.http.get(`/engagements/v1/engagements/associated/company/${companyId}/paged`)
    return data.results ?? []
  }
}

export class MockHubSpotClient implements Pick<HubSpotClient, 'getContacts' | 'getEngagements'> {
  async getContacts(accountId: string): Promise<HubSpotContact[]> {
    return [
      {
        id: `hs-contact-1-${accountId}`,
        properties: {
          firstname: 'María',
          lastname: 'García',
          email: 'maria@cliente.com',
          jobtitle: 'VP of Engineering',
        },
      },
      {
        id: `hs-contact-2-${accountId}`,
        properties: {
          firstname: 'Carlos',
          lastname: 'López',
          email: 'carlos@cliente.com',
          jobtitle: 'CTO',
        },
      },
    ]
  }

  async getEngagements(companyId: string): Promise<HubSpotEngagement[]> {
    const now = Date.now()
    return [
      {
        id: `hs-eng-1-${companyId}`,
        engagement: { type: 'MEETING', timestamp: now - 7 * 24 * 60 * 60 * 1000 },
        metadata: { subject: 'Quarterly Business Review', body: 'Revisión de objetivos Q1' },
      },
      {
        id: `hs-eng-2-${companyId}`,
        engagement: { type: 'EMAIL', timestamp: now - 3 * 24 * 60 * 60 * 1000 },
        metadata: { subject: 'Follow-up: implementación módulo X', body: '' },
      },
    ]
  }
}
