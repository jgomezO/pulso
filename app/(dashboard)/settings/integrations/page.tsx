import { Card, Chip } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconIntegration, IconTicket, IconSlack, IconTag } from '@/lib/icons'
import { GoogleCalendarCard } from '@/components/integrations/GoogleCalendarCard'
import type { SVGProps } from 'react'

interface Integration {
  name: string
  description: string
  status: 'available' | 'coming_soon'
  icon: React.FC<SVGProps<SVGSVGElement>>
}

const INTEGRATIONS: Integration[] = [
  {
    name: 'HubSpot',
    description: 'Sincroniza contactos y actividad de CRM',
    status: 'available',
    icon: IconIntegration,
  },
  {
    name: 'Intercom',
    description: 'Importa tickets de soporte y conversaciones',
    status: 'available',
    icon: IconTicket,
  },
  {
    name: 'Slack',
    description: 'Recibe alertas y notificaciones de riesgo',
    status: 'coming_soon',
    icon: IconSlack,
  },
  {
    name: 'Segment',
    description: 'Conecta datos de uso del producto',
    status: 'coming_soon',
    icon: IconTag,
  },
]

export default function IntegrationsPage() {
  return (
    <div>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <GoogleCalendarCard />
          {INTEGRATIONS.map((integration) => (
            <Card key={integration.name} className="border border-[#ECEEF5] rounded-[14px]">
              <Card.Header className="flex gap-3 pb-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#F7F8FC]">
                  <Icon icon={integration.icon} size={20} className="text-[#4F6EF7]" />
                </div>
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
