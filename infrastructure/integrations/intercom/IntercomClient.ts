import type { IntercomConversation } from './IntercomMapper'

export class IntercomClient {
  async getConversations(companyId: string): Promise<IntercomConversation[]> {
    const res = await fetch(
      `https://api.intercom.io/conversations?company_id=${companyId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`,
          Accept: 'application/json',
        },
      }
    )
    const data = await res.json()
    return data.conversations ?? []
  }
}

export class MockIntercomClient implements Pick<IntercomClient, 'getConversations'> {
  async getConversations(companyId: string): Promise<IntercomConversation[]> {
    const now = Math.floor(Date.now() / 1000)
    return [
      {
        id: `ic-1-${companyId}`,
        created_at: now - 2 * 24 * 60 * 60,
        updated_at: now - 1 * 24 * 60 * 60,
        subject: 'Error al exportar reportes PDF',
        state: 'open',
        priority: 'priority',
        source: { body: 'Los reportes fallan desde la actualización del martes.' },
      },
      {
        id: `ic-2-${companyId}`,
        created_at: now - 10 * 24 * 60 * 60,
        updated_at: now - 8 * 24 * 60 * 60,
        subject: 'Consulta sobre permisos de usuario',
        state: 'closed',
        priority: 'not_priority',
        source: { body: '¿Cómo configuro roles de administrador?' },
      },
      {
        id: `ic-3-${companyId}`,
        created_at: now - 5 * 24 * 60 * 60,
        updated_at: now - 4 * 24 * 60 * 60,
        subject: 'Integración con Salesforce no sincroniza',
        state: 'open',
        priority: 'priority',
        source: { body: 'Los contactos nuevos no aparecen en Pulso.' },
      },
    ]
  }
}
