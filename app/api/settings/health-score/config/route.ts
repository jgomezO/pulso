import { NextRequest } from 'next/server'
import { z } from 'zod'
import { HealthScoreConfigRepository } from '@/infrastructure/db/HealthScoreConfigRepository'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

const SignalConfigSchema = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number().min(0).max(100),
  isActive: z.boolean(),
})

const SaveSchema = z.object({
  signals: z.array(SignalConfigSchema),
})

export async function GET() {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const repo = new HealthScoreConfigRepository()
    const signals = await repo.getConfig(auth.orgId)
    return Response.json({ signals })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const body = await request.json()
    const parsed = SaveSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const repo = new HealthScoreConfigRepository()
    await repo.saveConfig(auth.orgId, parsed.data.signals)
    return Response.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ error: msg }, { status: 500 })
  }
}
