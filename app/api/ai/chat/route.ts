import { anthropic, AI_MODEL } from '@/infrastructure/ai/anthropic'
import { buildPlatformContext } from '@/infrastructure/ai/buildPlatformContext'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    })
  ).min(1),
})

export async function POST(request: Request) {
  try {
    // Authenticate
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse request
    const body = await request.json()
    const parsed = ChatRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { messages } = parsed.data

    // Get user's org
    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }

    // Build platform context
    const platformContext = await buildPlatformContext(serviceClient, profile.org_id)

    const systemPrompt = `Eres el asistente AI de Pulso, una plataforma de Customer Success. Tu nombre es Pulso AI.
Respondes en español, de forma concisa y accionable. Usas los datos reales del portafolio del usuario para dar respuestas específicas y basadas en datos.

Fecha actual: ${new Date().toISOString().slice(0, 10)}

# Datos del portafolio

${platformContext}

# Instrucciones

- Cuando el usuario pregunte sobre cuentas, tareas, renovaciones o riesgos, SIEMPRE usa los datos reales de arriba.
- Si una cuenta tiene health score bajo o tendencia declinante, sugiere acciones concretas.
- Puedes hacer cálculos con los datos: promedios, totales, comparaciones, rankings.
- Si el usuario pregunta por algo que no está en los datos, dilo claramente.
- Formatea las respuestas con markdown cuando sea útil (listas, negritas, tablas).
- Sé directo y evita introducciones largas.`

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const content = response.content[0]
    const text = content.type === 'text' ? content.text : ''

    return NextResponse.json({ message: text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: message },
      { status: 500 }
    )
  }
}
