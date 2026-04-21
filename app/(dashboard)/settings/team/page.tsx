'use client'

import { useState, useEffect } from 'react'
import { Button, TextField, Input, Select, ListBox, ListBoxItem, Label } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconContact } from '@/lib/icons'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

interface Member {
  id: string
  email: string
  name: string
  role: string
  joinedAt: string
  avatarUrl?: string
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      const res = await fetch('/api/org/members')
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/org/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: data.status === 'added'
            ? `${inviteEmail} fue agregado al equipo.`
            : `Invitación enviada a ${inviteEmail}.`,
        })
        setInviteEmail('')
        fetchMembers()
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Error al invitar' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#0F1117]">Equipo</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Gestiona los miembros de tu organización.
        </p>
      </div>

      {/* Invite form */}
      <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-5">
        <h2 className="text-sm font-semibold text-[#0F1117] mb-4">Invitar miembro</h2>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <TextField value={inviteEmail} onChange={setInviteEmail}>
              <Input
                placeholder="email@ejemplo.com"
                type="email"
                className="h-10 bg-white border border-[#ECEEF5] rounded-xl px-3 text-sm"
              />
            </TextField>
          </div>
          <div className="w-36">
            <Select.Root
              selectedKey={inviteRole}
              onSelectionChange={(key) => setInviteRole((key as string) ?? 'member')}
              className="w-full"
            >
              <Label className="sr-only">Rol</Label>
              <Select.Trigger className="w-full flex items-center justify-between border border-[#ECEEF5] rounded-xl px-3 h-10 text-sm bg-white hover:border-[#4F6EF7]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="member">Miembro</ListBoxItem>
                  <ListBoxItem id="admin">Admin</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select.Root>
          </div>
          <Button
            type="submit"
            isDisabled={inviting || !inviteEmail.trim()}
            className="h-10 px-5 bg-[#4F6EF7] text-white rounded-xl text-sm font-medium hover:bg-[#4060E8] transition-colors min-w-0"
          >
            {inviting ? 'Enviando...' : 'Invitar'}
          </Button>
        </form>

        {message && (
          <p className={`text-sm mt-3 ${message.type === 'success' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Members list */}
      <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-5">
        <h2 className="text-sm font-semibold text-[#0F1117] mb-4">
          Miembros ({members.length})
        </h2>

        {loading ? (
          <TableSkeleton rows={3} />
        ) : members.length === 0 ? (
          <p className="text-sm text-[#9CA3AF] text-center py-6">No hay miembros.</p>
        ) : (
          <div className="space-y-0">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-3 py-3 border-b border-[#ECEEF5] last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-[#4F6EF7]/10 flex items-center justify-center flex-shrink-0">
                  <Icon icon={IconContact} size={16} className="text-[#4F6EF7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F1117] truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-[#9CA3AF] truncate">{member.email}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  member.role === 'admin'
                    ? 'bg-[#F0EEFF] text-[#6C4EF2]'
                    : 'bg-[#F7F8FC] text-[#6B7280]'
                }`}>
                  {member.role === 'admin' ? 'Admin' : 'Miembro'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
