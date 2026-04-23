import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/supabase/apiAuth'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { generateHealthNarrative } from '@/infrastructure/ai/HealthNarrativeGenerator'
import type { HealthNarrativeContext, HealthNarrativeContact, HealthNarrativeEvent } from '@/infrastructure/ai/prompts/health-narrative.prompt'
import type { HealthSignals } from '@/domain/account/HealthScore'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id: accountId } = await params
    const refresh = request.nextUrl.searchParams.get('refresh') === 'true'
    const db = createServiceClient()

    // 1. Fetch latest health score
    const { data: latestHealth } = await db
      .from('health_score_history')
      .select('score, signals, calculated_at')
      .eq('account_id', accountId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    if (!latestHealth) {
      return Response.json({ narrative: null, generatedAt: null, score: null, reason: 'no_score' })
    }

    const currentScore = latestHealth.score as number

    // 2. Check cache (unless refresh requested)
    if (!refresh) {
      const { data: cached } = await db
        .from('account_ai_summaries')
        .select('content, generated_at, metadata')
        .eq('account_id', accountId)
        .eq('type', 'health_narrative')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (cached) {
        const cacheAge = Date.now() - new Date(cached.generated_at).getTime()
        const cacheHours = cacheAge / (1000 * 60 * 60)
        const cachedScore = (cached.metadata as Record<string, number>)?.score_at_generation ?? 0
        const scoreDelta = Math.abs(currentScore - cachedScore)

        if (cacheHours < 24 && scoreDelta < 10) {
          return Response.json({
            narrative: cached.content,
            generatedAt: cached.generated_at,
            score: currentScore,
          })
        }
      }
    }

    // 3. Gather context in parallel
    const [accountRes, healthHistoryRes, contactsRes, eventsRes, signalCountRes] = await Promise.all([
      // Account info
      db.from('accounts')
        .select('name, tier, renewal_date')
        .eq('id', accountId)
        .eq('org_id', auth.orgId)
        .single(),
      // Previous health record
      db.from('health_score_history')
        .select('score, signals')
        .eq('account_id', accountId)
        .order('calculated_at', { ascending: false })
        .limit(2),
      // Champion + Decision Maker contacts
      db.from('contacts')
        .select('name, role, last_contacted_at, is_champion')
        .eq('account_id', accountId)
        .or('is_champion.eq.true,role.eq.decision_maker'),
      // Recent events (7 days)
      db.from('account_events')
        .select('event_type, description, occurred_at')
        .eq('account_id', accountId)
        .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('occurred_at', { ascending: false })
        .limit(10),
      // Check if signals are configured (any non-zero values)
      db.from('health_score_history')
        .select('signals')
        .eq('account_id', accountId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single(),
    ])

    if (!accountRes.data) {
      return Response.json({ error: 'Account not found' }, { status: 404 })
    }

    const account = accountRes.data
    const signals = latestHealth.signals as HealthSignals | null
    const previousHealth = healthHistoryRes.data?.[1] ?? null

    // Check if signals are actually configured
    const signalsConfigured = signals !== null && (
      signals.productUsageScore > 0 ||
      signals.supportHealthScore > 0 ||
      signals.engagementScore > 0 ||
      (signals.npsScore !== null && signals.npsScore > 0) ||
      signals.paymentScore > 0 ||
      signals.stakeholderScore > 0
    )

    // Build contacts
    const champion = contactsRes.data?.find((c) => c.is_champion) ?? null
    const decisionMaker = contactsRes.data?.find((c) => c.role === 'decision_maker' && !c.is_champion) ?? null

    const buildContact = (c: { name: string; last_contacted_at: string | null } | null): HealthNarrativeContact | null => {
      if (!c) return null
      const lastContactDaysAgo = c.last_contacted_at
        ? Math.floor((Date.now() - new Date(c.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
        : null
      return { name: c.name, lastContactDaysAgo }
    }

    // Build events
    const recentEvents: HealthNarrativeEvent[] = (eventsRes.data ?? []).map((e) => ({
      type: e.event_type,
      description: e.description ?? '',
      daysAgo: Math.floor((Date.now() - new Date(e.occurred_at).getTime()) / (1000 * 60 * 60 * 24)),
    }))

    // 4. Generate narrative
    const ctx: HealthNarrativeContext = {
      accountName: account.name,
      score: currentScore,
      previousScore: previousHealth?.score ?? null,
      signals: signals ?? {
        productUsageScore: 0,
        supportHealthScore: 0,
        engagementScore: 0,
        npsScore: null,
        paymentScore: 0,
        stakeholderScore: 0,
      },
      previousSignals: (previousHealth?.signals as HealthSignals) ?? null,
      tier: account.tier,
      renewalDate: account.renewal_date,
      champion: buildContact(champion),
      decisionMaker: buildContact(decisionMaker),
      recentEvents,
      signalsConfigured,
    }

    const { content } = await generateHealthNarrative(ctx)

    // 5. Delete old cache + insert new
    await db
      .from('account_ai_summaries')
      .delete()
      .eq('account_id', accountId)
      .eq('type', 'health_narrative')

    const now = new Date().toISOString()
    await db
      .from('account_ai_summaries')
      .insert({
        account_id: accountId,
        type: 'health_narrative',
        content,
        generated_at: now,
        metadata: { score_at_generation: currentScore },
      })

    return Response.json({
      narrative: content,
      generatedAt: now,
      score: currentScore,
    })
  } catch (error) {
    console.error('GET /api/accounts/[id]/health-narrative error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
