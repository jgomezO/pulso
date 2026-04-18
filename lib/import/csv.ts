// ─── Parsing utilities for CSV import ─────────────────────────────────────

export function parseDate(raw: string): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // Slash-separated — determine order
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, a, b, y] = slashMatch
    const aNum = Number(a)
    const bNum = Number(b)
    // If a > 12 → must be DD/MM/YYYY
    if (aNum > 12) return `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
    // If b > 12 → must be MM/DD/YYYY
    if (bNum > 12) return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`
    // Ambiguous: default to MM/DD/YYYY
    return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`
  }

  // Dot-separated  DD.MM.YYYY
  const dotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dotMatch) {
    const [, d, m, y] = dotMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // JS fallback
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]

  return null
}

export function parseARR(raw: string): number | null {
  if (!raw?.trim()) return null
  const cleaned = raw.trim().replace(/[$€£¥,\s]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : Math.round(n)
}

const VALID_TIERS = ['enterprise', 'growth', 'starter', 'other'] as const
export function parseTier(raw: string): string | null {
  if (!raw?.trim()) return null
  const v = raw.trim().toLowerCase()
  if ((VALID_TIERS as readonly string[]).includes(v)) return v
  if (v.includes('enterprise')) return 'enterprise'
  if (v.includes('growth') || v.includes('pro') || v.includes('business')) return 'growth'
  if (v.includes('start') || v.includes('basic') || v.includes('free')) return 'starter'
  return null
}

const VALID_INDUSTRIES = ['saas', 'fintech', 'ecommerce', 'healthtech', 'other'] as const
export function parseIndustry(raw: string): string {
  if (!raw?.trim()) return 'other'
  const v = raw.trim().toLowerCase()
  if ((VALID_INDUSTRIES as readonly string[]).includes(v)) return v
  if (v.includes('saas') || v.includes('software') || v.includes('tech')) return 'saas'
  if (v.includes('fin') || v.includes('bank') || v.includes('payment') || v.includes('insurance')) return 'fintech'
  if (v.includes('ecom') || v.includes('retail') || v.includes('shop')) return 'ecommerce'
  if (v.includes('health') || v.includes('medic') || v.includes('pharma') || v.includes('bio')) return 'healthtech'
  return 'other'
}

// ─── Auto-mapping heuristics ───────────────────────────────────────────────

export type PulsoField = 'name' | 'domain' | 'tier' | 'arr' | 'renewal_date' | 'industry' | 'csm_email' | ''

const AUTO_MAP: Record<string, PulsoField> = {
  name:             'name',  'nombre': 'name', company: 'name', 'company name': 'name',
  account:          'name',  'account name': 'name', organization: 'name', empresa: 'name',
  domain:           'domain', website: 'domain', url: 'domain', dominio: 'domain',
  arr:              'arr',   revenue: 'arr', 'annual revenue': 'arr', 'annual recurring revenue': 'arr',
  mrr:              'arr',   'monthly revenue': 'arr',
  tier:             'tier',  plan: 'tier', segment: 'tier',
  industry:         'industry', sector: 'industry', vertical: 'industry',
  'renewal date':   'renewal_date', renewal: 'renewal_date', 'contract renewal': 'renewal_date',
  'renewal_date':   'renewal_date', 'fecha renovación': 'renewal_date', 'fecha renovacion': 'renewal_date',
  csm:              'csm_email', 'csm email': 'csm_email', owner: 'csm_email',
  'account manager':'csm_email', 'account owner': 'csm_email',
}

export function autoMap(header: string): PulsoField {
  const key = header.trim().toLowerCase()
  return AUTO_MAP[key] ?? ''
}

// ─── Row transformation ────────────────────────────────────────────────────

export interface MappedRow {
  _index:      number
  name:        string
  domain:      string | null
  tier:        string | null
  arr:         number | null
  renewalDate: string | null
  industry:    string | null
  csmEmail:    string | null
  errors:      string[]
}

export function transformRow(
  rawRow: Record<string, string>,
  mapping: Record<string, PulsoField>,
  index: number
): MappedRow {
  const get = (field: PulsoField): string => {
    const csvCol = Object.entries(mapping).find(([, f]) => f === field)?.[0]
    return csvCol ? (rawRow[csvCol] ?? '').trim() : ''
  }

  const errors: string[] = []

  const name = get('name')
  if (!name) errors.push('Nombre requerido')

  const arrRaw = get('arr')
  const arr    = arrRaw ? parseARR(arrRaw) : null
  if (arrRaw && arr === null) errors.push(`ARR inválido: "${arrRaw}"`)

  const tierRaw = get('tier')
  const tier    = tierRaw ? parseTier(tierRaw) : null
  if (tierRaw && tier === null) errors.push(`Tier inválido: "${tierRaw}" (usa: enterprise, growth, starter, other)`)

  const dateRaw     = get('renewal_date')
  const renewalDate = dateRaw ? parseDate(dateRaw) : null
  if (dateRaw && renewalDate === null) errors.push(`Fecha inválida: "${dateRaw}"`)

  const domain     = get('domain') || null
  const industry   = get('industry') ? parseIndustry(get('industry')) : null
  const csmEmail   = get('csm_email') || null

  return { _index: index, name, domain, tier, arr, renewalDate, industry, csmEmail, errors }
}
