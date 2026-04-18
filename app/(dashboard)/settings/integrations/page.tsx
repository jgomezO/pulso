import { Card, Chip } from '@heroui/react'

const INTEGRATIONS = [
  {
    name: 'HubSpot',
    description: 'Sincroniza contactos y actividad de CRM',
    status: 'available',
    icon: '🟠',
  },
  {
    name: 'Intercom',
    description: 'Importa tickets de soporte y conversaciones',
    status: 'available',
    icon: '🔵',
  },
  {
    name: 'Slack',
    description: 'Recibe alertas y notificaciones de riesgo',
    status: 'coming_soon',
    icon: '🟣',
  },
  {
    name: 'Segment',
    description: 'Conecta datos de uso del producto',
    status: 'coming_soon',
    icon: '⚫',
  },
]

export default function IntegrationsPage() {
  return (
    <div>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {INTEGRATIONS.map((integration) => (
            <Card key={integration.name} className="hover:shadow-md transition-shadow">
              <Card.Header className="flex gap-3 pb-2">
                <span className="text-2xl">{integration.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <Chip
                      size="sm"
                      color={integration.status === 'available' ? 'success' : 'default'}
                      variant="soft"
                    >
                      {integration.status === 'available' ? 'Disponible' : 'Próximamente'}
                    </Chip>
                  </div>
                </div>
              </Card.Header>
              <Card.Content className="pt-0">
                <p className="text-sm text-gray-500">{integration.description}</p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
