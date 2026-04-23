interface AccountData {
  riskLevel: string | null
  renewalDate: string | null
  healthScore: number | null
  healthTrend: string | null
  contacts: {
    isChampion: boolean
    lastContactedAt: string | null
  }[]
}

export function getSuggestedQuestions(account: AccountData): string[] {
  const questions: string[] = []

  // Risk-based questions
  if (account.riskLevel === 'high' || account.riskLevel === 'critical') {
    questions.push('¿Por qué esta cuenta está en riesgo?')
    questions.push('¿Qué acciones debería tomar para recuperarla?')
  }

  // Renewal proximity
  if (account.renewalDate) {
    const daysUntil = Math.ceil(
      (new Date(account.renewalDate).getTime() - Date.now()) / 86400000
    )
    if (daysUntil > 0 && daysUntil <= 90) {
      questions.push(`La renovación es en ${daysUntil} días. ¿Cómo estamos?`)
    }
  }

  // Declining health
  if (account.healthTrend === 'declining') {
    questions.push('¿Qué está causando la caída en el health score?')
  }

  // Champion inactivity
  const champion = account.contacts.find(c => c.isChampion)
  if (champion?.lastContactedAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(champion.lastContactedAt).getTime()) / 86400000
    )
    if (daysSince > 14) {
      questions.push('¿Cuándo fue la última vez que hablamos con el champion?')
    }
  } else if (champion && !champion.lastContactedAt) {
    questions.push('¿Cuándo fue la última vez que hablamos con el champion?')
  }

  // Always include these general ones
  questions.push('Prepárame un brief para mi próxima llamada')
  questions.push('Resumen ejecutivo de esta cuenta')

  return questions.slice(0, 4)
}
