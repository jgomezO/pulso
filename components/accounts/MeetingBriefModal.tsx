'use client'

import { useState, useRef } from 'react'
import { Button, Modal } from '@heroui/react'
import { useOverlayState } from '@heroui/react'
import type { Account } from '@/domain/account/Account'
import type { Contact } from '@/domain/contact/Contact'
import { formatCurrency } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/date'

interface MeetingBriefModalProps {
  account: Account
  contacts: Contact[]
}

export function MeetingBriefModal({ account, contacts }: MeetingBriefModalProps) {
  const state = useOverlayState()
  const [brief, setBrief] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function generateBrief() {
    setBrief('')
    setIsStreaming(true)

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          name: account.name,
          arr: formatCurrency(account.arr),
          healthScore: account.healthScore ?? 0,
          trend: account.healthTrend ?? 'stable',
          renewalDate: formatDate(account.renewalDate),
          recentEvents: [],
          openTickets: 0,
          usageSummary: 'No disponible',
          contacts: contacts.map((c) => ({
            name: c.name,
            role: c.role ?? '',
            isChampion: c.isChampion,
            isDecisionMaker: c.isDecisionMaker,
          })),
          lastMeetingDate: null,
          openRisks:
            account.riskLevel && account.riskLevel !== 'low'
              ? [`Nivel de riesgo: ${account.riskLevel}`]
              : [],
        }),
      })

      if (!response.ok) throw new Error('Error generating brief')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setBrief((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setBrief('Error al generar el brief. Intenta de nuevo.')
      }
    } finally {
      setIsStreaming(false)
    }
  }

  function handleOpen() {
    state.open()
    generateBrief()
  }

  function handleCopy() {
    navigator.clipboard.writeText(brief)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    abortRef.current?.abort()
    setIsStreaming(false)
    state.close()
  }

  return (
    <>
      <Button variant="secondary" onPress={handleOpen}>
        Brief de reunión
      </Button>

      <Modal.Root state={state}>
        <Modal.Backdrop isDismissable />
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <div>
                <p className="font-semibold">Brief de reunión</p>
                <p className="text-sm font-normal text-gray-500">{account.name}</p>
              </div>
            </Modal.Header>
            <Modal.Body>
              {isStreaming && !brief && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="animate-spin">⟳</span>
                  Generando con AI...
                </div>
              )}
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {brief}
                {isStreaming && (
                  <span className="inline-block w-1 h-4 bg-blue-500 ml-0.5 animate-pulse align-text-bottom" />
                )}
              </pre>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={handleClose}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                isDisabled={!brief || isStreaming}
                onPress={handleCopy}
              >
                {copied ? '¡Copiado!' : 'Copiar al portapapeles'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Root>
    </>
  )
}
