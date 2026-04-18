'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button, Checkbox, Table } from '@heroui/react'
import { transformRow, type PulsoField } from '@/lib/import/csv'
import { formatCurrency } from '@/lib/utils/format'

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? 'demo-org-id'

interface ImportPreviewProps {
  rows:         Record<string, string>[]
  mapping:      Record<string, PulsoField>
  onImported:   (result: ImportResult) => void
  onBack:       () => void
}

export interface ImportResult {
  imported: number
  updated:  number
  errors:   { row: number; name: string; message: string }[]
}

export function ImportPreview({ rows, mapping, onImported, onBack }: ImportPreviewProps) {
  const [existingDomains, setExistingDomains] = useState<Set<string>>(new Set())
  const [loadingDomains,  setLoadingDomains]  = useState(true)
  const [updateExisting,  setUpdateExisting]  = useState(false)
  const [importing,       setImporting]       = useState(false)

  useEffect(() => {
    fetch(`/api/accounts?orgId=${ORG_ID}&pageSize=500`)
      .then(r => r.json())
      .then(d => {
        const domains = new Set<string>((d.data ?? []).map((a: { domain?: string | null }) => a.domain).filter(Boolean))
        setExistingDomains(domains)
        setLoadingDomains(false)
      })
      .catch(() => setLoadingDomains(false))
  }, [])

  const mappedRows = useMemo(
    () => rows.map((r, i) => transformRow(r, mapping, i)),
    [rows, mapping]
  )

  const validRows      = mappedRows.filter(r => r.errors.length === 0 && r.name)
  const errorRows      = mappedRows.filter(r => r.errors.length > 0 || !r.name)
  const duplicateRows  = validRows.filter(r => r.domain && existingDomains.has(r.domain))
  const importableRows = validRows.filter(r => updateExisting || !r.domain || !existingDomains.has(r.domain))

  async function handleImport() {
    setImporting(true)
    const res = await fetch('/api/accounts/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        orgId:          ORG_ID,
        rows:           importableRows.map(r => ({
          name:        r.name,
          domain:      r.domain,
          tier:        r.tier,
          arr:         r.arr,
          renewalDate: r.renewalDate,
          industry:    r.industry,
          csmEmail:    r.csmEmail,
        })),
        updateExisting,
      }),
    })
    setImporting(false)
    if (!res.ok) return
    const result = await res.json()
    onImported(result)
  }

  const thClass = 'text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]'
  const tdClass = 'px-3 py-2.5 text-sm'

  return (
    <div className="space-y-4">
      {/* Summary counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#E8FAF0] border border-[#22C55E]/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-[#22C55E]">{importableRows.length}</p>
          <p className="text-[10px] font-semibold text-[#22C55E]/80 uppercase tracking-wider mt-0.5">Válidas</p>
        </div>
        <div className={`rounded-xl p-3 text-center border ${errorRows.length > 0 ? 'bg-[#FEE8E8] border-[#EF4444]/20' : 'bg-[#F7F8FC] border-[#ECEEF5]'}`}>
          <p className={`text-2xl font-bold ${errorRows.length > 0 ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>{errorRows.length}</p>
          <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${errorRows.length > 0 ? 'text-[#EF4444]/80' : 'text-[#9CA3AF]'}`}>Con errores</p>
        </div>
        <div className={`rounded-xl p-3 text-center border ${duplicateRows.length > 0 ? 'bg-[#FEF3E8] border-[#F58C37]/20' : 'bg-[#F7F8FC] border-[#ECEEF5]'}`}>
          <p className={`text-2xl font-bold ${duplicateRows.length > 0 ? 'text-[#F58C37]' : 'text-[#9CA3AF]'}`}>{duplicateRows.length}</p>
          <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${duplicateRows.length > 0 ? 'text-[#F58C37]/80' : 'text-[#9CA3AF]'}`}>Duplicadas</p>
        </div>
      </div>

      {/* Update existing option */}
      {duplicateRows.length > 0 && (
        <Checkbox.Root
          isSelected={updateExisting}
          onChange={setUpdateExisting}
          className="flex items-center gap-3 p-3 bg-white border border-[#ECEEF5] rounded-xl cursor-pointer hover:border-[#4F6EF7]/40 transition-colors"
        >
          <Checkbox.Control className="w-4 h-4 border-2 border-[#D1D5DB] rounded data-[selected]:bg-[#4F6EF7] data-[selected]:border-[#4F6EF7] flex items-center justify-center flex-shrink-0">
            <Checkbox.Indicator>
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Control>
          <Checkbox.Content>
            <p className="text-sm font-medium text-[#0F1117]">Actualizar cuentas existentes con datos del CSV</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{duplicateRows.length} cuenta{duplicateRows.length !== 1 ? 's' : ''} serán actualizadas por dominio</p>
          </Checkbox.Content>
        </Checkbox.Root>
      )}

      {/* Preview table */}
      <div className="bg-white border border-[#ECEEF5] rounded-[14px] overflow-hidden max-h-[400px] overflow-auto">
        <Table.Root>
          <Table.Content aria-label="Import preview">
          <Table.Header>
            <Table.Column className={thClass}>Estado</Table.Column>
            <Table.Column className={thClass}>Nombre</Table.Column>
            <Table.Column className={thClass}>Dominio</Table.Column>
            <Table.Column className={thClass}>Tier</Table.Column>
            <Table.Column className={thClass}>ARR</Table.Column>
            <Table.Column className={thClass}>Renovación</Table.Column>
          </Table.Header>
          <Table.Body>
            {mappedRows.map((row, i) => {
              const hasError    = row.errors.length > 0 || !row.name
              const isDuplicate = !hasError && row.domain ? existingDomains.has(row.domain) : false
              const rowClass    = hasError
                ? 'bg-[#FEE8E8]/40 border-b border-[#EF4444]/10'
                : isDuplicate
                  ? 'bg-[#FEF3E8]/40 border-b border-[#F58C37]/10'
                  : 'border-b border-[#ECEEF5] hover:bg-[#F7F8FC] transition-colors'

              return (
                <Table.Row key={i} className={rowClass}>
                  <Table.Cell className={`${tdClass} w-8`}>
                    {hasError ? (
                      <span title={row.errors.join('\n')} className="text-xs text-[#EF4444] cursor-help">✕</span>
                    ) : isDuplicate ? (
                      <span title="Dominio ya existe" className="text-xs text-[#F58C37] cursor-help">≈</span>
                    ) : (
                      <span className="text-xs text-[#22C55E]">✓</span>
                    )}
                  </Table.Cell>
                  <Table.Cell className={`${tdClass} font-medium text-[#0F1117]`}>
                    {row.name || <span className="text-[#EF4444] italic">vacío</span>}
                    {hasError && (
                      <p className="text-[10px] text-[#EF4444] mt-0.5">{row.errors.join(' · ')}</p>
                    )}
                  </Table.Cell>
                  <Table.Cell className={`${tdClass} text-[#6B7280]`}>{row.domain ?? <span className="text-[#D1D5DB]">—</span>}</Table.Cell>
                  <Table.Cell className={tdClass}>
                    {row.tier ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EEF1FE] text-[#4F6EF7] capitalize">{row.tier}</span>
                    ) : <span className="text-[#D1D5DB]">—</span>}
                  </Table.Cell>
                  <Table.Cell className={`${tdClass} text-[#0F1117] font-medium`}>
                    {row.arr != null ? formatCurrency(row.arr) : <span className="text-[#D1D5DB]">—</span>}
                  </Table.Cell>
                  <Table.Cell className={`${tdClass} text-[#6B7280]`}>
                    {row.renewalDate ?? <span className="text-[#D1D5DB]">—</span>}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
          </Table.Content>
        </Table.Root>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onPress={onBack}
          className="h-9 px-4 border border-[#ECEEF5] text-[#6B7280] rounded-xl text-sm font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors"
        >
          ← Volver al mapeo
        </Button>
        <div className="flex items-center gap-3">
          {!loadingDomains && importableRows.length === 0 && (
            <p className="text-xs text-[#9CA3AF]">Sin cuentas válidas para importar</p>
          )}
          <Button
            onPress={handleImport}
            isDisabled={importing || loadingDomains || importableRows.length === 0}
            className="h-9 px-5 bg-[#4F6EF7] text-white rounded-xl text-sm font-semibold hover:bg-[#4060E8] transition-colors disabled:opacity-40"
          >
            {importing
              ? 'Importando…'
              : `Importar ${importableRows.length} cuenta${importableRows.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
