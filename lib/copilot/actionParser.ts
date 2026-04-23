export type ActionType = 'create_task' | 'compose_email' | 'add_note' | 'schedule_meeting'

export interface CopilotAction {
  type: ActionType
  params: Record<string, string>
  label: string
}

const ACTION_LABELS: Record<ActionType, string> = {
  create_task: 'Crear tarea',
  compose_email: 'Componer email',
  add_note: 'Agregar nota',
  schedule_meeting: 'Agendar reunión',
}

function resolveDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const today = new Date()
  if (dateStr === 'this_week') {
    const friday = new Date(today)
    friday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7)
    return friday.toISOString().slice(0, 10)
  }
  if (dateStr === 'next_week') {
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7 + 7)
    return nextFriday.toISOString().slice(0, 10)
  }
  return dateStr
}

export function parseActions(text: string): { cleanText: string; actions: CopilotAction[] } {
  const actionRegex = /\[ACTION:(\w+)\|([^\]]+)\]/g
  const actions: CopilotAction[] = []
  let match

  while ((match = actionRegex.exec(text)) !== null) {
    const type = match[1] as ActionType
    const parts = match[2].split('|').map(s => s.trim())

    if (!(type in ACTION_LABELS)) continue

    switch (type) {
      case 'create_task':
        actions.push({
          type,
          params: {
            title: parts[0] || '',
            priority: parts[1] || 'medium',
            dueDate: parts[2] ? resolveDate(parts[2]) : '',
          },
          label: `${ACTION_LABELS[type]}: ${parts[0] || ''}`,
        })
        break

      case 'compose_email':
        actions.push({
          type,
          params: {
            emailType: parts[0] || 'follow_up',
            contactName: parts[1] || '',
          },
          label: `${ACTION_LABELS[type]} a ${parts[1] || 'contacto'}`,
        })
        break

      case 'add_note':
        actions.push({
          type,
          params: { title: parts[0] || '' },
          label: `${ACTION_LABELS[type]}: ${parts[0] || ''}`,
        })
        break

      case 'schedule_meeting':
        actions.push({
          type,
          params: {
            description: parts[0] || '',
            contactName: parts[1] || '',
          },
          label: `${ACTION_LABELS[type]}: ${parts[0] || ''}`,
        })
        break
    }
  }

  const cleanText = text.replace(actionRegex, '').trim()
  return { cleanText, actions: actions.slice(0, 3) }
}
