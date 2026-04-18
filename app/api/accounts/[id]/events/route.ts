import { NextRequest } from 'next/server'
import { z } from 'zod'
import { EventRepositorySupabase } from '@/infrastructure/db/EventRepositorySupabase'
import { EVENT_TYPES } from '@/domain/event/AccountEvent'

const GetQuerySchema = z.object({
  type:     z.enum(EVENT_TYPES).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  counts:   z.coerce.boolean().default(false),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const query = GetQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!query.success) {
      return Response.json({ error: query.error.flatten() }, { status: 400 })
    }

    const { type, page, pageSize, counts: includeCounts } = query.data
    const repo = new EventRepositorySupabase()

    if (includeCounts) {
      const counts = await repo.countByType(id)
      return Response.json({ counts })
    }

    const offset = (page - 1) * pageSize
    const events = await repo.findFiltered({
      accountId: id,
      types: type ? [type] : undefined,
      limit: pageSize,
      offset,
    })

    return Response.json({
      data: events,
      page,
      pageSize,
      hasMore: events.length === pageSize,
    })
  } catch (error) {
    console.error('GET /api/accounts/[id]/events error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const PostBodySchema = z.object({
  type:        z.enum(EVENT_TYPES),
  title:       z.string().min(1).max(200).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  sentiment:   z.enum(['positive', 'neutral', 'negative'] as const).nullable().optional(),
  metadata:    z.record(z.string(), z.unknown()).nullable().optional(),
  occurredAt:  z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body   = await request.json()
    const parsed = PostBodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const repo  = new EventRepositorySupabase()
    const event = await repo.create({
      accountId:   id,
      source:      'manual',
      type:        parsed.data.type,
      title:       parsed.data.title       ?? null,
      description: parsed.data.description ?? null,
      sentiment:   parsed.data.sentiment   ?? null,
      metadata:    parsed.data.metadata    ?? null,
      occurredAt:  parsed.data.occurredAt  ?? new Date().toISOString(),
    })

    return Response.json(event, { status: 201 })
  } catch (error) {
    console.error('POST /api/accounts/[id]/events error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
