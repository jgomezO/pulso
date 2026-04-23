import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/supabase/apiAuth'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { generateEmail, improveEmail } from '@/infrastructure/ai/EmailComposerGenerator'
import { EMAIL_TYPES } from '@/infrastructure/ai/prompts/email-composer.prompt'
import type { EmailComposerContext, EmailComposerContact, EmailComposerEvent } from '@/infrastructure/ai/prompts/email-composer.prompt'

const PostBodySchema = z.object({
  mode: z.enum(['generate', 'improve']).default('generate'),
  emailType: z.enum(EMAIL_TYPES),
  contactId: z.string().uuid(),
  additionalContext: z.string().max(500).nullable().optional(),
  currentSubject: z.string().max(200).optional(),
  currentBody: z.string().max(10000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id: accountId } = await params
    const body = await request.json()
    const parsed = PostBodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { mode, emailType, contactId, additionalContext, currentSubject, currentBody } = parsed.data
    const db = createServiceClient()

    // Gather context in parallel
    const [accountRes, contactRes, eventsRes, ticketsRes] = await Promise.all([
      db.from('accounts')
        .select('name, domain, tier, arr, renewal_date, health_score, health_trend')
        .eq('id', accountId)
        .eq('org_id', auth.orgId)
        .single(),
      db.from('contacts')
        .select('name, email, title, is_champion, is_decision_maker')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single(),
      db.from('account_events')
        .select('event_type, title, description, occurred_at')
        .eq('account_id', accountId)
        .order('occurred_at', { ascending: false })
        .limit(5),
      db.from('account_events')
        .select('event_type, title, description, occurred_at')
        .eq('account_id', accountId)
        .eq('event_type', 'ticket')
        .order('occurred_at', { ascending: false })
        .limit(5),
    ])

    if (!accountRes.data) {
      return Response.json({ error: 'Account not found' }, { status: 404 })
    }
    if (!contactRes.data) {
      return Response.json({ error: 'Contact not found' }, { status: 404 })
    }

    const account = accountRes.data
    const contact = contactRes.data

    if (!contact.email) {
      return Response.json({ error: 'Contact has no email address' }, { status: 400 })
    }

    // Calculate renewal days
    let renewalDaysLeft: number | null = null
    if (account.renewal_date) {
      const diff = new Date(account.renewal_date).getTime() - Date.now()
      renewalDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const recipient: EmailComposerContact = {
      name: contact.name,
      email: contact.email,
      title: contact.title,
      isChampion: contact.is_champion ?? false,
      isDecisionMaker: contact.is_decision_maker ?? false,
    }

    const recentEvents: EmailComposerEvent[] = (eventsRes.data ?? []).map(e => ({
      type: e.event_type,
      title: e.title,
      description: e.description,
      occurredAt: e.occurred_at,
    }))

    const openTickets: EmailComposerEvent[] = (ticketsRes.data ?? []).map(e => ({
      type: e.event_type,
      title: e.title,
      description: e.description,
      occurredAt: e.occurred_at,
    }))

    const hasMinimalContext = recentEvents.length > 0 || account.health_score !== null

    let result: { subject: string; body: string }

    if (mode === 'improve') {
      if (!currentSubject || !currentBody) {
        return Response.json({ error: 'currentSubject and currentBody are required for improve mode' }, { status: 400 })
      }

      result = await improveEmail({
        emailType,
        accountName: account.name,
        recipientName: contact.name,
        recipientTitle: contact.title,
        currentSubject,
        currentBody,
        additionalContext: additionalContext ?? null,
      })
    } else {
      const ctx: EmailComposerContext = {
        emailType,
        accountName: account.name,
        accountDomain: account.domain,
        tier: account.tier,
        arr: account.arr,
        healthScore: account.health_score,
        healthTrend: account.health_trend,
        renewalDate: account.renewal_date,
        renewalDaysLeft,
        recipient,
        recentEvents,
        openTickets,
        additionalContext: additionalContext ?? null,
      }

      result = await generateEmail(ctx)
    }

    return Response.json({
      subject: result.subject,
      body: result.body,
      to: contact.email,
      recipientName: contact.name,
      tip: mode === 'generate' && !hasMinimalContext
        ? 'Tip: agrega más actividad al timeline para que los emails sean más personalizados.'
        : null,
    })
  } catch (error) {
    console.error('POST /api/accounts/[id]/compose-email error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
