import type Anthropic from '@anthropic-ai/sdk'

export const chatTools: Anthropic.Tool[] = [
  {
    name: 'create_task',
    description:
      'Crea una tarea para una cuenta específica. Usa esta herramienta cuando el usuario pida crear una tarea, dar seguimiento, o cuando sugieras una acción concreta para una cuenta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        account_id: {
          type: 'string',
          description: 'UUID de la cuenta a la que pertenece la tarea',
        },
        account_name: {
          type: 'string',
          description: 'Nombre de la cuenta (para mostrar al usuario)',
        },
        title: {
          type: 'string',
          description: 'Título descriptivo de la tarea (1-300 caracteres)',
        },
        description: {
          type: 'string',
          description: 'Descripción detallada de la tarea (opcional)',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Prioridad de la tarea',
        },
        due_date: {
          type: 'string',
          description: 'Fecha límite en formato ISO (YYYY-MM-DD). Opcional.',
        },
      },
      required: ['account_id', 'account_name', 'title', 'priority'],
    },
  },
  {
    name: 'create_plan',
    description:
      'Crea un plan de éxito (success plan) para una cuenta. Usa esta herramienta cuando el usuario pida crear un plan de rescate, plan de onboarding, plan de renovación, o cualquier plan estratégico para una cuenta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        account_id: {
          type: 'string',
          description: 'UUID de la cuenta',
        },
        account_name: {
          type: 'string',
          description: 'Nombre de la cuenta (para mostrar al usuario)',
        },
        title: {
          type: 'string',
          description: 'Título del plan',
        },
        objective: {
          type: 'string',
          description: 'Objetivo del plan',
        },
        template_type: {
          type: 'string',
          enum: ['onboarding', 'at_risk', 'renewal', 'expansion', 'custom'],
          description: 'Tipo de template del plan',
        },
        start_date: {
          type: 'string',
          description: 'Fecha de inicio (YYYY-MM-DD)',
        },
        target_date: {
          type: 'string',
          description: 'Fecha objetivo (YYYY-MM-DD)',
        },
      },
      required: ['account_id', 'account_name', 'title', 'template_type'],
    },
  },
  {
    name: 'log_activity',
    description:
      'Registra una actividad o evento para una cuenta. Usa esta herramienta cuando el usuario quiera registrar una nota, llamada, email, reunión, o cualquier interacción con una cuenta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        account_id: {
          type: 'string',
          description: 'UUID de la cuenta',
        },
        account_name: {
          type: 'string',
          description: 'Nombre de la cuenta (para mostrar al usuario)',
        },
        type: {
          type: 'string',
          enum: ['note', 'email', 'call', 'meeting', 'ticket'],
          description: 'Tipo de actividad',
        },
        title: {
          type: 'string',
          description: 'Título breve de la actividad',
        },
        description: {
          type: 'string',
          description: 'Descripción detallada (opcional)',
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'negative'],
          description: 'Sentimiento de la interacción',
        },
      },
      required: ['account_id', 'account_name', 'type', 'title'],
    },
  },
]

export interface ToolAction {
  tool: string
  input: Record<string, unknown>
  status: 'pending' | 'executed' | 'error'
  result?: Record<string, unknown>
  error?: string
}
