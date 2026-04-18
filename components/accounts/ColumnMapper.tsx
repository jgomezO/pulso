'use client'

import { Select, ListBox, ListBoxItem } from '@heroui/react'
import { autoMap, type PulsoField } from '@/lib/import/csv'
import { Icon } from '@/components/shared/Icon'
import { IconChevronRight, IconCheck } from '@/lib/icons'

const PULSO_FIELDS: { value: PulsoField; label: string; required?: boolean }[] = [
  { value: '',             label: '— No importar —'                            },
  { value: 'name',         label: 'Nombre *',              required: true       },
  { value: 'domain',       label: 'Dominio'                                    },
  { value: 'tier',         label: 'Tier (enterprise/growth/starter/other)'     },
  { value: 'arr',          label: 'ARR (numérico)'                             },
  { value: 'renewal_date', label: 'Fecha de renovación'                        },
  { value: 'industry',     label: 'Industria'                                  },
  { value: 'csm_email',    label: 'Email del CSM'                              },
]

interface ColumnMapperProps {
  headers:    string[]
  sampleRows: Record<string, string>[]
  mapping:    Record<string, PulsoField>
  onChange:   (mapping: Record<string, PulsoField>) => void
}

export function ColumnMapper({ headers, sampleRows, mapping, onChange }: ColumnMapperProps) {
  function handleChange(csvCol: string, field: PulsoField) {
    const next = { ...mapping }
    if (field !== '') {
      for (const col of Object.keys(next)) {
        if (next[col] === field) next[col] = ''
      }
    }
    next[csvCol] = field
    onChange(next)
  }

  const usedFields = new Set(Object.values(mapping).filter(Boolean))

  return (
    <div className="space-y-1">
      {/* Column header */}
      <div className="grid grid-cols-[1fr_24px_1fr] gap-3 px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
        <span>Columna del CSV</span>
        <span />
        <span>Campo en Pulso</span>
      </div>

      {headers.map(col => {
        const sample   = sampleRows.slice(0, 3).map(r => r[col]).filter(Boolean).join(', ')
        const selected = mapping[col] ?? ''
        const isRequired = selected === 'name'

        return (
          <div
            key={col}
            className={`grid grid-cols-[1fr_24px_1fr] gap-3 items-center px-4 py-3 rounded-xl border transition-colors ${
              isRequired ? 'border-[#4F6EF7]/30 bg-[#EEF1FE]/30' : 'border-[#ECEEF5] bg-white'
            }`}
          >
            {/* CSV column */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0F1117] truncate">{col}</p>
              {sample && <p className="text-[10px] text-[#9CA3AF] truncate mt-0.5">{sample}</p>}
            </div>

            {/* Arrow */}
            <span className="text-[#9CA3AF] flex justify-center"><Icon icon={IconChevronRight} size={16} /></span>

            {/* Pulso field select */}
            <Select.Root
              selectedKey={selected || null}
              onSelectionChange={key => handleChange(col, (key as PulsoField) ?? '')}
              className="w-full"
            >
              <Select.Trigger
                className={`h-9 w-full px-2.5 border rounded-lg text-sm cursor-pointer focus:outline-none focus:border-[#4F6EF7] transition-colors flex items-center justify-between ${
                  selected
                    ? 'border-[#4F6EF7] text-[#4F6EF7] bg-[#EEF1FE]/50 font-medium'
                    : 'border-[#ECEEF5] text-[#9CA3AF] bg-white'
                }`}
              >
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {PULSO_FIELDS.map(f => (
                    <ListBoxItem
                      key={f.value || '__empty__'}
                      id={f.value || ''}
                      isDisabled={f.value !== '' && f.value !== selected && usedFields.has(f.value)}
                    >
                      {f.label}{f.value !== '' && f.value !== selected && usedFields.has(f.value) ? <span className="ml-1 inline-flex items-center"><Icon icon={IconCheck} size={10} /></span> : ''}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select.Root>
          </div>
        )
      })}
    </div>
  )
}

/** Build initial mapping from auto-map heuristics */
export function buildInitialMapping(headers: string[]): Record<string, PulsoField> {
  const mapping: Record<string, PulsoField> = {}
  const usedFields = new Set<PulsoField>()

  for (const h of headers) {
    const field = autoMap(h)
    if (field && !usedFields.has(field)) {
      mapping[h] = field
      usedFields.add(field)
    } else {
      mapping[h] = ''
    }
  }
  return mapping
}
