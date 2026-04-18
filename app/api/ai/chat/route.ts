import { anthropic, AI_MODEL } from '@/infrastructure/ai/anthropic'
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
    const body = await request.json()
    const parsed = ChatRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { messages } = parsed.data

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system: 'Eres un asistente de Customer Success para la plataforma Pulso. Responde de forma concisa y útil en español.',
      messages,
    })

    const content = response.content[0]
    const text = content.type === 'text' ? content.text : ''

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
