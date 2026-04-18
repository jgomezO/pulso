import type { PlanTemplateType } from '@/domain/plan/SuccessPlan'

export interface TemplateTask {
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface TemplateMilestone {
  title: string
  tasks: TemplateTask[]
}

export interface PlanTemplate {
  type:       PlanTemplateType
  label:      string
  objective:  string
  daysTarget: number
  milestones: TemplateMilestone[]
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    type:       'onboarding',
    label:      'Onboarding',
    objective:  'Llevar al cliente a first value en 30 días',
    daysTarget: 30,
    milestones: [
      {
        title: 'Kickoff completado',
        tasks: [
          { title: 'Agendar kickoff', priority: 'high' },
          { title: 'Enviar welcome package', priority: 'medium' },
          { title: 'Definir success criteria', priority: 'high' },
        ],
      },
      {
        title: 'Configuración técnica',
        tasks: [
          { title: 'Setup del producto', priority: 'high' },
          { title: 'Integración completada', priority: 'high' },
          { title: 'Training del equipo', priority: 'medium' },
        ],
      },
      {
        title: 'First value alcanzado',
        tasks: [
          { title: 'Verificar adopción inicial', priority: 'medium' },
          { title: 'Check-in semana 3', priority: 'medium' },
          { title: 'Documentar caso de éxito', priority: 'low' },
        ],
      },
    ],
  },
  {
    type:       'at_risk',
    label:      'En riesgo',
    objective:  'Recuperar cuenta en riesgo en 45 días',
    daysTarget: 45,
    milestones: [
      {
        title: 'Diagnóstico',
        tasks: [
          { title: 'Analizar causa del riesgo', priority: 'urgent' },
          { title: 'Hablar con champion', priority: 'urgent' },
          { title: 'Revisar tickets abiertos', priority: 'high' },
        ],
      },
      {
        title: 'Plan de recuperación',
        tasks: [
          { title: 'Proponer solución', priority: 'high' },
          { title: 'Agendar EBR', priority: 'high' },
          { title: 'Escalar internamente si necesario', priority: 'medium' },
        ],
      },
      {
        title: 'Estabilización',
        tasks: [
          { title: 'Verificar mejora en uso', priority: 'high' },
          { title: 'Follow-up semanal', priority: 'medium' },
          { title: 'Confirmar renovación', priority: 'high' },
        ],
      },
    ],
  },
  {
    type:       'renewal',
    label:      'Renovación',
    objective:  'Asegurar renovación exitosa',
    daysTarget: 90,
    milestones: [
      {
        title: 'Preparación (90 días antes)',
        tasks: [
          { title: 'Revisar contrato actual', priority: 'high' },
          { title: 'Preparar QBR', priority: 'high' },
          { title: 'Contactar decisor', priority: 'high' },
        ],
      },
      {
        title: 'Negociación (60 días)',
        tasks: [
          { title: 'Presentar propuesta', priority: 'high' },
          { title: 'Negociar términos', priority: 'medium' },
          { title: 'Resolver objeciones', priority: 'high' },
        ],
      },
      {
        title: 'Cierre (30 días)',
        tasks: [
          { title: 'Confirmar aprobación', priority: 'urgent' },
          { title: 'Enviar contrato', priority: 'urgent' },
          { title: 'Celebrar renovación', priority: 'low' },
        ],
      },
    ],
  },
  {
    type:       'expansion',
    label:      'Expansión',
    objective:  'Expandir el contrato (upsell/cross-sell)',
    daysTarget: 60,
    milestones: [
      {
        title: 'Identificar oportunidad',
        tasks: [
          { title: 'Analizar uso actual', priority: 'medium' },
          { title: 'Detectar necesidades no cubiertas', priority: 'medium' },
        ],
      },
      {
        title: 'Propuesta',
        tasks: [
          { title: 'Preparar business case', priority: 'high' },
          { title: 'Presentar al decisor', priority: 'high' },
          { title: 'Demo de nuevas features', priority: 'high' },
        ],
      },
      {
        title: 'Cierre',
        tasks: [
          { title: 'Negociar', priority: 'high' },
          { title: 'Firmar expansión', priority: 'urgent' },
          { title: 'Onboarding de nuevo módulo', priority: 'medium' },
        ],
      },
    ],
  },
]

export function getTemplate(type: PlanTemplateType): PlanTemplate | undefined {
  return PLAN_TEMPLATES.find(t => t.type === type)
}
