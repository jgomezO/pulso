'use client'

import { useState } from 'react'
import { Button } from '@heroui/react'
import type { Account } from '@/domain/account/Account'
import { Icon } from '@/components/shared/Icon'
import { IconCheck, IconClose, IconExport } from '@/lib/icons'

interface SyncButtonsProps {
  account: Account
  onSynced?: () => void
}

type SyncState = 'idle' | 'loading' | 'success' | 'error'

export function SyncButtons({ account, onSynced }: SyncButtonsProps) {
  const [hubspotState, setHubspotState] = useState<SyncState>('idle')
  const [intercomState, setIntercomState] = useState<SyncState>('idle')

  async function syncHubSpot() {
    setHubspotState('loading')
    try {
      const res = await fetch('/api/integrations/hubspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          hubspotCompanyId: account.hubspotId ?? account.id,
        }),
      })
      if (!res.ok) throw new Error()
      setHubspotState('success')
      onSynced?.()
      setTimeout(() => setHubspotState('idle'), 3000)
    } catch {
      setHubspotState('error')
      setTimeout(() => setHubspotState('idle'), 3000)
    }
  }

  async function syncIntercom() {
    setIntercomState('loading')
    try {
      const res = await fetch('/api/integrations/intercom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          intercomCompanyId: account.intercomId ?? account.id,
        }),
      })
      if (!res.ok) throw new Error()
      setIntercomState('success')
      onSynced?.()
      setTimeout(() => setIntercomState('idle'), 3000)
    } catch {
      setIntercomState('error')
      setTimeout(() => setIntercomState('idle'), 3000)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="ghost"
        isDisabled={hubspotState === 'loading'}
        onPress={syncHubSpot}
      >
        {hubspotState === 'loading'
          ? 'Sincronizando...'
          : hubspotState === 'success'
          ? <span className="inline-flex items-center gap-1"><Icon icon={IconCheck} size={14} /> HubSpot</span>
          : hubspotState === 'error'
          ? <span className="inline-flex items-center gap-1"><Icon icon={IconClose} size={14} /> Error</span>
          : <span className="inline-flex items-center gap-1"><Icon icon={IconExport} size={14} /> HubSpot</span>}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        isDisabled={intercomState === 'loading'}
        onPress={syncIntercom}
      >
        {intercomState === 'loading'
          ? 'Sincronizando...'
          : intercomState === 'success'
          ? <span className="inline-flex items-center gap-1"><Icon icon={IconCheck} size={14} /> Intercom</span>
          : intercomState === 'error'
          ? <span className="inline-flex items-center gap-1"><Icon icon={IconClose} size={14} /> Error</span>
          : <span className="inline-flex items-center gap-1"><Icon icon={IconExport} size={14} /> Intercom</span>}
      </Button>
    </div>
  )
}
