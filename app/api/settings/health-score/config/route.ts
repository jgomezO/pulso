import { NextRequest } from 'next/server'
import { z } from 'zod'
import { HealthScoreConfigRepository } from '@/infrastructure/db/HealthScoreConfigRepository'

const OrgSchema = z.object({ orgId: z.string().uuid() })

const SignalConfigSchema = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number().min(0).max(100),
  isActive: z.boolean(),
})

const SaveSchema = z.object({
  orgId: z.string().uuid(),
  signals: z.array(SignalConfigSchema),
})

export async function GET(request: NextRequest) {
  try {
    const parsed = OrgSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const repo = new HealthScoreConfigRepository()
    const signals = await repo.getConfig(parsed.data.orgId)
    return Response.json({ signals })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = SaveSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const repo = new HealthScoreConfigRepository()
    await repo.saveConfig(parsed.data.orgId, parsed.data.signals)
    return Response.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ error: msg }, { status: 500 })
  }
}
