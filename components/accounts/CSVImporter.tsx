'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { Button, Table } from '@heroui/react'
import { ColumnMapper, buildInitialMapping } from './ColumnMapper'
import { ImportPreview, type ImportResult } from './ImportPreview'
import type { PulsoField } from '@/lib/import/csv'
import { Icon } from '@/components/shared/Icon'
import { IconCheck, IconWarning, IconDanger, IconRenewal, IconChevronRight, IconBack } from '@/lib/icons'

const MAX_ROWS = 500

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Archivo', 'Mapeo', 'Confirmar']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n       = i + 1
        const done    = current > n
        const active  = current === n
        return (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                done   ? 'bg-[#22C55E] text-white'
                : active ? 'bg-[#4F6EF7] text-white'
                : 'bg-[#F7F8FC] border border-[#ECEEF5] text-[#9CA3AF]'
              }`}>
                {done ? <Icon icon={IconCheck} size={12} /> : n}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-[#4F6EF7]' : done ? 'text-[#22C55E]' : 'text-[#9CA3AF]'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-px mx-3 ${done ? 'bg-[#22C55E]' : 'bg-[#ECEEF5]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Drop zone ───────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(file: File): boolean {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Solo se aceptan archivos .csv')
      return false
    }
    setError('')
    return true
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    const file = files[0]
    if (validate(file)) onFile(file)
  }

  return (
    <div>
      <div
        onDragOver={e  => { e.preventDefault(); setDragging(true)  }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-[14px] p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[#4F6EF7] bg-[#EEF1FE]/40' : 'border-[#ECEEF5] hover:border-[#4F6EF7]/50 hover:bg-[#F7F8FC]'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-[#EEF1FE] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-[#4F6EF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#0F1117]">Arrastra tu archivo CSV aquí</p>
        <p className="text-xs text-[#9CA3AF] mt-1">o haz clic para seleccionar</p>
        <p className="text-[10px] text-[#9CA3AF] mt-2">Máximo {MAX_ROWS} filas · Solo archivos .csv</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-xs text-[#EF4444] mt-2">{error}</p>}
    </div>
  )
}

// ─── Preview table ───────────────────────────────────────────────────────────

function FilePreview({ headers, rows, filename, onReset }: {
  headers:  string[]
  rows:     Record<string, string>[]
  filename: string
  onReset:  () => void
}) {
  const preview = rows.slice(0, 5)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E8FAF0] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F1117]">{filename}</p>
            <p className="text-xs text-[#9CA3AF]">{rows.length} filas · {headers.length} columnas</p>
          </div>
        </div>
        <Button onPress={onReset} className="text-xs text-[#9CA3AF] hover:text-[#EF4444] transition-colors bg-transparent min-w-0 h-auto p-0">
          Cambiar archivo
        </Button>
      </div>

      <div className="border border-[#ECEEF5] rounded-[14px] overflow-hidden">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider px-4 py-2 bg-[#F7F8FC] border-b border-[#ECEEF5]">
          Primeras 5 filas
        </p>
        <div className="overflow-x-auto">
          <Table.Root>
            <Table.Content aria-label="File preview">
            <Table.Header>
              {headers.map(h => (
                <Table.Column key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap border-b border-[#ECEEF5]">
                  {h}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {preview.map((row, i) => (
                <Table.Row key={i} className="border-b border-[#ECEEF5] last:border-0">
                  {headers.map(h => (
                    <Table.Cell key={h} className="px-3 py-2 text-sm text-[#6B7280] whitespace-nowrap max-w-[180px] truncate">
                      {row[h] ?? ''}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
            </Table.Content>
          </Table.Root>
        </div>
      </div>
    </div>
  )
}

// ─── Result banner ───────────────────────────────────────────────────────────

function ResultBanner({ result, onDownloadErrors }: { result: ImportResult; onDownloadErrors: () => void }) {
  const hasErrors = result.errors.length > 0
  return (
    <div className={`p-4 rounded-[14px] border ${hasErrors ? 'bg-[#FEF3E8]/50 border-[#F58C37]/30' : 'bg-[#E8FAF0]/50 border-[#22C55E]/30'}`}>
      <p className={`inline-flex items-center gap-1 text-sm font-semibold ${hasErrors ? 'text-[#F58C37]' : 'text-[#22C55E]'}`}>
        {hasErrors ? <><Icon icon={IconWarning} size={14} /> Importación completada con advertencias</> : <><Icon icon={IconCheck} size={14} /> Importación completada</>}
      </p>
      <div className="mt-2 space-y-0.5">
        {result.imported > 0 && <p className="inline-flex items-center gap-1 text-xs text-[#6B7280]"><Icon icon={IconCheck} size={12} /> {result.imported} cuenta{result.imported !== 1 ? 's' : ''} importada{result.imported !== 1 ? 's' : ''}</p>}
        {result.updated  > 0 && <p className="inline-flex items-center gap-1 text-xs text-[#6B7280]"><Icon icon={IconRenewal} size={12} /> {result.updated} cuenta{result.updated !== 1 ? 's' : ''} actualizada{result.updated !== 1 ? 's' : ''}</p>}
        {result.errors.length > 0 && (
          <p className="inline-flex items-center gap-1 text-xs text-[#F58C37]">
            <Icon icon={IconDanger} size={12} /> {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''}{' '}
            <Button onPress={onDownloadErrors} className="underline hover:no-underline ml-1 text-xs text-[#F58C37] bg-transparent min-w-0 h-auto p-0">
              Descargar errores CSV
            </Button>
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

export function CSVImporter() {
  const router = useRouter()
  const [step,     setStep]     = useState<1 | 2 | 3>(1)
  const [filename, setFilename] = useState('')
  const [headers,  setHeaders]  = useState<string[]>([])
  const [rows,     setRows]     = useState<Record<string, string>[]>([])
  const [mapping,  setMapping]  = useState<Record<string, PulsoField>>({})
  const [parseErr, setParseErr] = useState('')
  const [result,   setResult]   = useState<ImportResult | null>(null)

  const handleFile = useCallback((file: File) => {
    setParseErr('')
    Papa.parse<Record<string, string>>(file, {
      header:         true,
      skipEmptyLines: true,
      dynamicTyping:  false,
      transformHeader: (h: string) => h.trim(),
      complete: results => {
        const parsed = results.data as Record<string, string>[]
        if (parsed.length === 0) {
          setParseErr('El archivo está vacío o no tiene filas de datos.')
          return
        }
        if (parsed.length > MAX_ROWS) {
          setParseErr(`El archivo tiene ${parsed.length} filas. El límite es ${MAX_ROWS}. Divide el archivo e importa por partes.`)
          return
        }
        const hdrs = results.meta.fields ?? []
        setFilename(file.name)
        setHeaders(hdrs)
        setRows(parsed)
        setMapping(buildInitialMapping(hdrs))
      },
      error: (err: { message: string }) => {
        setParseErr(`Error al parsear: ${err.message}`)
      },
    })
  }, [])

  const isNameMapped = Object.values(mapping).includes('name')

  function handleImported(res: ImportResult) {
    setResult(res)
    // Redirect to /accounts after short delay
    setTimeout(() => router.push('/accounts'), 2000)
  }

  function downloadErrors() {
    if (!result) return
    const lines = ['Row,Name,Error', ...result.errors.map(e => `${e.row},"${e.name.replace(/"/g, '""')}","${e.message.replace(/"/g, '""')}"`)]
    const blob  = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href = url; a.download = 'import-errors.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <StepIndicator current={step} />

      {result && (
        <div className="mb-6">
          <ResultBanner result={result} onDownloadErrors={downloadErrors} />
        </div>
      )}

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="space-y-5">
          {rows.length === 0 ? (
            <>
              <DropZone onFile={handleFile} />
              {parseErr && (
                <p className="text-sm text-[#EF4444] bg-[#FEE8E8]/50 border border-[#EF4444]/20 rounded-xl px-4 py-3">
                  {parseErr}
                </p>
              )}
            </>
          ) : (
            <>
              <FilePreview
                headers={headers}
                rows={rows}
                filename={filename}
                onReset={() => { setRows([]); setHeaders([]); setMapping({}); setFilename('') }}
              />
              <div className="flex justify-end">
                <Button
                 
                  onPress={() => setStep(2)}
                  className="h-9 px-5 bg-[#4F6EF7] text-white rounded-xl text-sm font-semibold hover:bg-[#4060E8] transition-colors min-w-0"
                >
                  <span className="inline-flex items-center gap-1">Siguiente: Mapear columnas <Icon icon={IconChevronRight} size={14} /></span>
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0F1117]">Mapeo de columnas</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Asocia las columnas del CSV con los campos de Pulso</p>
              </div>
              {!isNameMapped && (
                <span className="inline-flex items-center gap-1 text-xs text-[#F58C37] bg-[#FEF3E8] px-2 py-1 rounded-lg font-medium">
                  <Icon icon={IconWarning} size={12} /> Mapea el campo "Nombre"
                </span>
              )}
            </div>
            <ColumnMapper
              headers={headers}
              sampleRows={rows.slice(0, 3)}
              mapping={mapping}
              onChange={setMapping}
            />
          </div>

          <div className="flex justify-between">
            <Button
             
              onPress={() => setStep(1)}
              className="h-9 px-4 border border-[#ECEEF5] text-[#6B7280] rounded-xl text-sm font-medium hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-colors min-w-0"
            >
              <span className="inline-flex items-center gap-1"><Icon icon={IconBack} size={14} /> Volver</span>
            </Button>
            <Button
             
              onPress={() => setStep(3)}
              isDisabled={!isNameMapped}
              className="h-9 px-5 bg-[#4F6EF7] text-white rounded-xl text-sm font-semibold hover:bg-[#4060E8] transition-colors disabled:opacity-40 min-w-0"
            >
              <span className="inline-flex items-center gap-1">Siguiente: Preview <Icon icon={IconChevronRight} size={14} /></span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#0F1117]">Preview de importación</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{rows.length} filas del CSV · Revisa antes de confirmar</p>
          </div>
          <ImportPreview
            headers={headers}
            rows={rows}
            mapping={mapping}
            onImported={handleImported}
            onBack={() => setStep(2)}
          />
        </div>
      )}
    </div>
  )
}
