export interface SignalDefinition {
  key: string
  label: string
  description: string
}

export const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  { key: 'product_usage',        label: 'Uso del producto',           description: '¿Qué tan activamente usa el cliente el producto?' },
  { key: 'nps',                  label: 'Satisfacción del cliente',   description: 'NPS, CSAT o percepción general del cliente' },
  { key: 'support_tickets',      label: 'Salud del soporte',          description: '¿Hay tickets críticos abiertos o sin resolver?' },
  { key: 'engagement',           label: 'Engagement con el equipo',   description: '¿El cliente responde correos y asiste a reuniones?' },
  { key: 'payment_health',       label: 'Salud del contrato',         description: '¿Está al día con pagos? ¿Hay señales de no renovar?' },
  { key: 'stakeholder_activity', label: 'Relación con contactos clave', description: '¿El campeón interno está activo y comprometido?' },
]

export interface SignalConfig {
  key: string
  label: string
  weight: number   // 0–100 integer (percentage)
  isActive: boolean
}

export const DEFAULT_SIGNAL_CONFIG: SignalConfig[] = [
  { key: 'product_usage',        label: 'Uso del producto',             weight: 30, isActive: true },
  { key: 'nps',                  label: 'Satisfacción del cliente',     weight: 15, isActive: true },
  { key: 'support_tickets',      label: 'Salud del soporte',            weight: 20, isActive: true },
  { key: 'engagement',           label: 'Engagement con el equipo',     weight: 20, isActive: true },
  { key: 'payment_health',       label: 'Salud del contrato',           weight: 10, isActive: true },
  { key: 'stakeholder_activity', label: 'Relación con contactos clave', weight:  5, isActive: true },
]
