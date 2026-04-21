import { anthropic, AI_MODEL } from '@/infrastructure/ai/anthropic'
import { buildPlatformContext } from '@/infrastructure/ai/buildPlatformContext'
import { chatTools, type ToolAction } from '@/infrastructure/ai/chat-tools'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { TaskRepositorySupabase } from '@/infrastructure/db/TaskRepositorySupabase'
import { SuccessPlanRepositorySupabase } from '@/infrastructure/db/SuccessPlanRepositorySupabase'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type Anthropic from '@anthropic-ai/sdk'

const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    })
  ).min(1),
})

interface CreateTaskInput {
  account_id: string
  account_name: string
  title: string
  description?: string
  priority: string
  due_date?: string
}

interface CreatePlanInput {
  account_id: string
  account_name: string
  title: string
  objective?: string
  template_type: string
  start_date?: string
  target_date?: string
}

interface LogActivityInput {
  account_id: string
  account_name: string
  type: string
  title: string
  description?: string
  sentiment?: string
}

async function resolveAccountId(
  serviceClient: ReturnType<typeof createServiceClient>,
  accountId: string,
  accountName: string
): Promise<string> {
  // If it looks like a valid UUID, verify it exists
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(accountId)) {
    const { data } = await serviceClient
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .single()
    if (data) return data.id as string
  }

  // Fallback: search by name (fuzzy)
  const { data } = await serviceClient
    .from('accounts')
    .select('id')
    .ilike('name', `%${accountName}%`)
    .limit(1)
    .single()

  if (data) return data.id as string
  throw new Error(`No se encontró la cuenta "${accountName}"`)
}

async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
  serviceClient: ReturnType<typeof createServiceClient>
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    // Resolve the account ID for all tools
    const accountId = await resolveAccountId(
      serviceClient,
      input.account_id as string,
      input.account_name as string
    )

    switch (name) {
      case 'create_task': {
        const data = input as unknown as CreateTaskInput
        const repo = new TaskRepositorySupabase()
        const task = await repo.create({
          accountId,
          title: data.title,
          description: data.description ?? null,
          priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
          dueDate: data.due_date ?? null,
        })
        return {
          success: true,
          result: { id: task.id, title: task.title, accountId, accountName: data.account_name },
        }
      }
      case 'create_plan': {
        const data = input as unknown as CreatePlanInput
        const repo = new SuccessPlanRepositorySupabase()
        const plan = await repo.create({
          accountId,
          title: data.title,
          objective: data.objective ?? null,
          templateType: data.template_type as 'onboarding' | 'at_risk' | 'renewal' | 'expansion' | 'custom',
          startDate: data.start_date ?? new Date().toISOString().split('T')[0],
          targetDate: data.target_date ?? null,
          useTemplate: false,
        })
        return {
          success: true,
          result: { id: plan.id, title: plan.title, accountId, accountName: data.account_name },
        }
      }
      case 'log_activity': {
        const data = input as unknown as LogActivityInput
        const repo = new EventRepositorySupabase()
        const event = await repo.create({
          accountId,
          type: data.type as 'note' | 'email' | 'call' | 'meeting' | 'ticket',
          source: 'manual',
          title: data.title,
          description: data.description ?? null,
          sentiment: (data.sentiment as 'positive' | 'neutral' | 'negative') ?? null,
          metadata: null,
          occurredAt: new Date().toISOString(),
        })
        return {
          success: true,
          result: { id: event.id, title: data.title, type: data.type, accountId, accountName: data.account_name },
        }
      }
      default:
        return { success: false, error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Tool ${name} error:`, message, 'input:', JSON.stringify(input))
    return { success: false, error: message }
  }
}

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
- Sé directo y evita introducciones largas.

# Herramientas disponibles

Tienes herramientas para crear tareas, planes de éxito y registrar actividades.
- Usa las herramientas PROACTIVAMENTE cuando identifiques situaciones que lo ameriten.
- Si muestras cuentas en riesgo, OFRECE crear un plan de rescate o tareas de seguimiento.
- Si el usuario pide crear algo, usa la herramienta correspondiente directamente.
- Al usar herramientas, siempre incluye el account_id correcto de los datos del portafolio.
- Después de ejecutar una herramienta, confirma al usuario qué se creó.`

    // Build messages for Anthropic API
    const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // Call Claude with tools - loop until we get a final text response
    const actions: ToolAction[] = []
    let finalText = ''
    let currentMessages = [...apiMessages]

    // Allow up to 5 tool-use iterations
    for (let i = 0; i < 5; i++) {
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: currentMessages,
        tools: chatTools,
      })

      // Process response content blocks
      const textBlocks: string[] = []
      const toolUseBlocks: Anthropic.ContentBlockParam[] = []

      for (const block of response.content) {
        if (block.type === 'text') {
          textBlocks.push(block.text)
        } else if (block.type === 'tool_use') {
          // Execute the tool
          const toolResult = await executeToolCall(block.name, block.input as Record<string, unknown>, serviceClient)

          actions.push({
            tool: block.name,
            input: block.input as Record<string, unknown>,
            status: toolResult.success ? 'executed' : 'error',
            result: toolResult.result,
            error: toolResult.error,
          })

          toolUseBlocks.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(
              toolResult.success
                ? { success: true, ...toolResult.result }
                : { success: false, error: toolResult.error }
            ),
          } as unknown as Anthropic.ContentBlockParam)
        }
      }

      // If there were tool uses, continue the loop with tool results
      if (toolUseBlocks.length > 0) {
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: response.content as Anthropic.ContentBlockParam[] },
          { role: 'user', content: toolUseBlocks },
        ]
        // If there was also text in this response, save it
        if (textBlocks.length > 0) {
          finalText += textBlocks.join('\n')
        }
      } else {
        // No tool use - we're done
        finalText += textBlocks.join('\n')
        break
      }

      // If stop_reason is end_turn without tool_use, break
      if (response.stop_reason === 'end_turn' && toolUseBlocks.length === 0) {
        break
      }
    }

    return NextResponse.json({
      message: finalText,
      actions: actions.length > 0 ? actions : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('AI Chat error:', message)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: message },
      { status: 500 }
    )
  }
}
