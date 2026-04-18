import { NextRequest } from 'next/server'
import { z } from 'zod'
import { SignalValuesRepository } from '@/infrastructure/db/SignalValuesRepository'

const SignalValueSchema = z.object({
  key: z.string(),
  value: z.number().min(0).max(100),
})

const SaveSchema = z.object({
  values: z.array(SignalValueSchema),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const repo = new SignalValuesRepository()
    const values = await repo.getByAccountId(id)
    return Response.json({ values })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = SaveSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const repo = new SignalValuesRepository()
    await repo.upsertValues(id, parsed.data.values)
    return Response.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ error: msg }, { status: 500 })
  }
}
