'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Chip } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconCalendar, IconCheck, IconWarning } from '@/lib/icons'

interface ConnectionStatus {
  connected: boolean
  lastSync: string | null
}

export function GoogleCalendarCard() {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false, lastSync: null })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/integrations/google-calendar/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    window.location.href = '/api/integrations/google-calendar/auth'
  }

  async function handleSync() {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/integrations/google-calendar/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Sync completado: ${data.eventsCreated} eventos creados, ${data.eventsSkipped} omitidos`)
        await fetchStatus()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/integrations/google-calendar/disconnect', { method: 'POST' })
      if (res.ok) {
        setStatus({ connected: false, lastSync: null })
        setMessage('Google Calendar desconectado')
      }
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border border-[#ECEEF5] rounded-[14px]">
        <Card.Header className="flex gap-3 pb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#F7F8FC]">
            <Icon icon={IconCalendar} size={20} className="text-[#4F6EF7]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Google Calendar</h3>
            <p className="text-sm text-gray-400">Cargando...</p>
          </div>
        </Card.Header>
      </Card>
    )
  }

  return (
    <Card className="border border-[#ECEEF5] rounded-[14px]">
      <Card.Header className="flex gap-3 pb-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#F7F8FC]">
          <Icon icon={IconCalendar} size={20} className="text-[#4F6EF7]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Google Calendar</h3>
            <Chip
              size="sm"
              color={status.connected ? 'success' : 'default'}
              variant="soft"
            >
              {status.connected ? 'Conectado' : 'Disponible'}
            </Chip>
          </div>
        </div>
      </Card.Header>
      <Card.Content className="pt-0 space-y-3">
        <p className="text-sm text-gray-500">
          Sincroniza reuniones y eventos del calendario con tus cuentas de clientes.
        </p>

        {status.lastSync && (
          <p className="text-xs text-gray-400">
            Última sincronización: {new Date(status.lastSync).toLocaleString()}
          </p>
        )}

        {message && (
          <div className="flex items-center gap-2 text-sm">
            <Icon
              icon={message.startsWith('Error') ? IconWarning : IconCheck}
              size={16}
              className={message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}
            />
            <span className={message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}>
              {message}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {!status.connected ? (
            <Button
              size="sm"
              variant="primary"
              onPress={handleConnect}
            >
              Conectar
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="primary"
                onPress={handleSync}
                isDisabled={syncing}
              >
                Sincronizar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDisconnect}
                isDisabled={disconnecting}
              >
                Desconectar
              </Button>
            </>
          )}
        </div>
      </Card.Content>
    </Card>
  )
}
