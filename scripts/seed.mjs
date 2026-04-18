import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const daysAgo = d => new Date(Date.now() - d * 86400000).toISOString()

// IDs válidos UUID v4 (version=4, variant=8)
const ORG  = '00000000-0000-4000-8000-000000000001'
const A1   = 'a0000001-0000-4000-8000-000000000001'
const A2   = 'a0000002-0000-4000-8000-000000000001'
const A3   = 'a0000003-0000-4000-8000-000000000001'
const A4   = 'a0000004-0000-4000-8000-000000000001'
const A5   = 'a0000005-0000-4000-8000-000000000001'
const A6   = 'a0000006-0000-4000-8000-000000000001'
const A7   = 'a0000007-0000-4000-8000-000000000001'
const A8   = 'a0000008-0000-4000-8000-000000000001'
const A9   = 'a0000009-0000-4000-8000-000000000001'
const A10  = 'a000000a-0000-4000-8000-000000000001'

async function seed() {
  // Limpiar datos previos (por slug para manejar cambios de ID)
  const { data: orgs } = await db.from('organizations').select('id').eq('slug', 'acme')
  const orgIds = (orgs ?? []).map(o => o.id).concat(ORG)
  const { data: accs } = await db.from('accounts').select('id').in('org_id', orgIds)
  const accIds = (accs ?? []).map(a => a.id)
  if (accIds.length > 0) {
    await db.from('health_score_history').delete().in('account_id', accIds)
    await db.from('account_events').delete().in('account_id', accIds)
    await db.from('contacts').delete().in('account_id', accIds)
    await db.from('accounts').delete().in('id', accIds)
  }
  await db.from('organizations').delete().eq('slug', 'acme')
  console.log('✓ Limpieza previa')

  // Organization
  const { error: e1 } = await db.from('organizations').upsert({
    id: ORG, name: 'Acme CS Team', slug: 'acme', plan: 'growth'
  }, { onConflict: 'id' })
  if (e1) { console.error('org:', e1.message); return }
  console.log('✓ Organization')

  // Accounts
  const { error: e2 } = await db.from('accounts').insert([
    { id: A1,  org_id: ORG, name: 'TechCorp Solutions', domain: 'techcorp.io',    arr: 120000, mrr: 10000, tier: 'enterprise', renewal_date: '2026-07-15', health_score: 82, health_trend: 'improving', risk_level: 'low' },
    { id: A2,  org_id: ORG, name: 'DataFlow Inc',       domain: 'dataflow.com',   arr:  84000, mrr:  7000, tier: 'growth',     renewal_date: '2026-05-30', health_score: 61, health_trend: 'stable',    risk_level: 'medium' },
    { id: A3,  org_id: ORG, name: 'CloudBase',          domain: 'cloudbase.dev',  arr:  48000, mrr:  4000, tier: 'growth',     renewal_date: '2026-06-10', health_score: 38, health_trend: 'declining', risk_level: 'high' },
    { id: A4,  org_id: ORG, name: 'NexaRetail',         domain: 'nexaretail.co',  arr: 240000, mrr: 20000, tier: 'enterprise', renewal_date: '2026-09-01', health_score: 90, health_trend: 'improving', risk_level: 'low' },
    { id: A5,  org_id: ORG, name: 'FinTrack Pro',       domain: 'fintrack.pro',   arr:  36000, mrr:  3000, tier: 'starter',    renewal_date: '2026-05-15', health_score: 22, health_trend: 'declining', risk_level: 'critical' },
    { id: A6,  org_id: ORG, name: 'Opus Media',         domain: 'opusmedia.net',  arr:  60000, mrr:  5000, tier: 'growth',     renewal_date: '2026-08-20', health_score: 74, health_trend: 'stable',    risk_level: 'medium' },
    { id: A7,  org_id: ORG, name: 'Stackwise',          domain: 'stackwise.io',   arr:  96000, mrr:  8000, tier: 'enterprise', renewal_date: '2026-10-05', health_score: 88, health_trend: 'improving', risk_level: 'low' },
    { id: A8,  org_id: ORG, name: 'Meridian Labs',      domain: 'meridian.ai',    arr:  18000, mrr:  1500, tier: 'starter',    renewal_date: '2026-05-01', health_score: 45, health_trend: 'declining', risk_level: 'high' },
    { id: A9,  org_id: ORG, name: 'Pulsewave',          domain: 'pulsewave.co',   arr:  72000, mrr:  6000, tier: 'growth',     renewal_date: '2026-07-30', health_score: 68, health_trend: 'stable',    risk_level: 'medium' },
    { id: A10, org_id: ORG, name: 'Orbis Platform',     domain: 'orbis.io',       arr: 180000, mrr: 15000, tier: 'enterprise', renewal_date: '2026-11-15', health_score: 55, health_trend: 'declining', risk_level: 'high' },
  ])
  if (e2) { console.error('accounts:', e2.message); return }
  console.log('✓ 10 accounts')

  // Contacts
  const { error: e3 } = await db.from('contacts').insert([
    { account_id: A1,  name: 'Ana Martínez',   email: 'ana@techcorp.io',      role: 'VP Engineering',     is_champion: true,  is_decision_maker: false, engagement_score: 88 },
    { account_id: A1,  name: 'Roberto Silva',  email: 'roberto@techcorp.io',  role: 'CTO',                is_champion: false, is_decision_maker: true,  engagement_score: 72 },
    { account_id: A2,  name: 'Carla Vega',     email: 'carla@dataflow.com',   role: 'Product Manager',    is_champion: true,  is_decision_maker: false, engagement_score: 65 },
    { account_id: A2,  name: 'Miguel Torres',  email: 'miguel@dataflow.com',  role: 'CEO',                is_champion: false, is_decision_maker: true,  engagement_score: 40 },
    { account_id: A3,  name: 'Luis Herrera',   email: 'luis@cloudbase.dev',   role: 'Engineering Lead',   is_champion: true,  is_decision_maker: true,  engagement_score: 30 },
    { account_id: A4,  name: 'Sofía Ruiz',     email: 'sofia@nexaretail.co',  role: 'Head of Technology', is_champion: true,  is_decision_maker: false, engagement_score: 92 },
    { account_id: A4,  name: 'Diego Morales',  email: 'diego@nexaretail.co',  role: 'CFO',                is_champion: false, is_decision_maker: true,  engagement_score: 78 },
    { account_id: A5,  name: 'Patricia Núñez', email: 'patricia@fintrack.pro',role: 'Founder',            is_champion: true,  is_decision_maker: true,  engagement_score: 18 },
    { account_id: A10, name: 'Andrés Castro',  email: 'andres@orbis.io',      role: 'VP Operations',      is_champion: true,  is_decision_maker: false, engagement_score: 55 },
    { account_id: A10, name: 'Elena Fuentes',  email: 'elena@orbis.io',       role: 'CTO',                is_champion: false, is_decision_maker: true,  engagement_score: 48 },
  ])
  if (e3) { console.error('contacts:', e3.message); return }
  console.log('✓ 10 contacts')

  // Events
  const { error: e4 } = await db.from('account_events').insert([
    { account_id: A1,  type: 'meeting',        source: 'hubspot',  title: 'QBR Q1 2026',                      description: 'Revisión trimestral exitosa. NPS 9/10.',          sentiment: 'positive', occurred_at: daysAgo(5) },
    { account_id: A1,  type: 'nps',            source: 'manual',   title: 'NPS Survey Q1',                    description: 'Score: 9',                                        sentiment: 'positive', occurred_at: daysAgo(10) },
    { account_id: A1,  type: 'support_ticket', source: 'intercom', title: 'Consulta API rate limits',         description: 'Consulta técnica resuelta en 2h.',                sentiment: 'neutral',  occurred_at: daysAgo(15) },
    { account_id: A3,  type: 'support_ticket', source: 'intercom', title: 'Fallo en exportación de datos',    description: 'Exportaciones CSV fallan desde hace 3 días.',      sentiment: 'negative', occurred_at: daysAgo(2) },
    { account_id: A3,  type: 'support_ticket', source: 'intercom', title: 'Integración con Salesforce caída', description: 'La sincronización automática dejó de funcionar.',  sentiment: 'negative', occurred_at: daysAgo(7) },
    { account_id: A3,  type: 'email',          source: 'hubspot',  title: 'Sin respuesta a follow-up',        description: 'No han respondido los últimos 2 correos.',         sentiment: 'negative', occurred_at: daysAgo(14) },
    { account_id: A5,  type: 'support_ticket', source: 'intercom', title: 'Solicitud de cancelación',         description: 'Patricia indicó que evaluarán no renovar.',        sentiment: 'negative', occurred_at: daysAgo(3) },
    { account_id: A5,  type: 'nps',            source: 'manual',   title: 'NPS Survey Q1',                    description: 'Score: 3 — muy insatisfecho.',                    sentiment: 'negative', occurred_at: daysAgo(20) },
    { account_id: A5,  type: 'meeting',        source: 'hubspot',  title: 'Llamada de rescate',               description: 'Reunión de emergencia para entender fricción.',    sentiment: 'neutral',  occurred_at: daysAgo(1) },
    { account_id: A4,  type: 'meeting',        source: 'hubspot',  title: 'Planning expansión Q2',            description: 'Quieren licencias para 3 equipos nuevos.',         sentiment: 'positive', occurred_at: daysAgo(3) },
    { account_id: A4,  type: 'nps',            source: 'manual',   title: 'NPS Survey Q1',                    description: 'Score: 10 — promotores activos.',                 sentiment: 'positive', occurred_at: daysAgo(8) },
    { account_id: A2,  type: 'email',          source: 'hubspot',  title: 'Check-in mensual',                 description: 'Respuesta positiva. Sin bloqueos.',               sentiment: 'neutral',  occurred_at: daysAgo(6) },
    { account_id: A10, type: 'support_ticket', source: 'intercom', title: 'Performance degradada',            description: 'Reportan lentitud en dashboards.',                sentiment: 'negative', occurred_at: daysAgo(4) },
    { account_id: A10, type: 'meeting',        source: 'hubspot',  title: 'Revisión de contrato',             description: 'Quieren renegociar precio. Mencionaron alternativas.', sentiment: 'negative', occurred_at: daysAgo(10) },
  ])
  if (e4) { console.error('events:', e4.message); return }
  console.log('✓ 14 events')

  // Health score history
  const { error: e5 } = await db.from('health_score_history').insert([
    { account_id: A1,  score: 82, signals: { productUsageScore:85, supportHealthScore:90, engagementScore:80, npsScore:90,   paymentScore:100, stakeholderScore:70 }, calculated_at: daysAgo(1) },
    { account_id: A1,  score: 76, signals: { productUsageScore:78, supportHealthScore:88, engagementScore:72, npsScore:85,   paymentScore:100, stakeholderScore:65 }, calculated_at: daysAgo(8) },
    { account_id: A3,  score: 38, signals: { productUsageScore:40, supportHealthScore:20, engagementScore:30, npsScore:null, paymentScore:90,  stakeholderScore:25 }, calculated_at: daysAgo(1) },
    { account_id: A3,  score: 52, signals: { productUsageScore:55, supportHealthScore:50, engagementScore:45, npsScore:null, paymentScore:90,  stakeholderScore:40 }, calculated_at: daysAgo(8) },
    { account_id: A5,  score: 22, signals: { productUsageScore:15, supportHealthScore:10, engagementScore:20, npsScore:30,   paymentScore:80,  stakeholderScore:10 }, calculated_at: daysAgo(1) },
    { account_id: A4,  score: 90, signals: { productUsageScore:95, supportHealthScore:95, engagementScore:92, npsScore:100,  paymentScore:100, stakeholderScore:85 }, calculated_at: daysAgo(1) },
    { account_id: A10, score: 55, signals: { productUsageScore:60, supportHealthScore:40, engagementScore:50, npsScore:55,   paymentScore:90,  stakeholderScore:45 }, calculated_at: daysAgo(1) },
    { account_id: A10, score: 68, signals: { productUsageScore:72, supportHealthScore:65, engagementScore:62, npsScore:65,   paymentScore:90,  stakeholderScore:55 }, calculated_at: daysAgo(8) },
  ])
  if (e5) { console.error('health history:', e5.message); return }
  console.log('✓ Health score history')

  console.log('\n✅ Seed completado')
}

seed().catch(console.error)
