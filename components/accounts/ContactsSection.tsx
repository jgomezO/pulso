'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Contact } from '@/domain/contact/Contact'
import { ContactCard } from '@/components/contacts/ContactCard'
import { ContactModal } from '@/components/contacts/ContactModal'
import { Icon } from '@/components/shared/Icon'
import { IconStar, IconChevronRight } from '@/lib/icons'

interface ContactsSectionProps {
  accountId: string
}

export function ContactsSection({ accountId }: ContactsSectionProps) {
  const [contacts, setContacts]     = useState<Contact[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Contact | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    try {
      const res  = await fetch(`/api/accounts/${accountId}/contacts`)
      const data = await res.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [accountId])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  function handleSaved(contact: Contact) {
    setContacts(prev => {
      const idx = prev.findIndex(c => c.id === contact.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = contact
        // Re-sort: champions first, then DMs
        return next.sort((a, b) => {
          if (a.isChampion !== b.isChampion) return a.isChampion ? -1 : 1
          if (a.isDecisionMaker !== b.isDecisionMaker) return a.isDecisionMaker ? -1 : 1
          return 0
        })
      }
      return [contact, ...prev]
    })
    setShowModal(false)
    setEditing(null)
  }

  async function handleDelete(contact: Contact) {
    if (!confirm(`¿Eliminar a ${contact.name}?`)) return
    setDeleting(contact.id)
    try {
      await fetch(`/api/accounts/${accountId}/contacts/${contact.id}`, { method: 'DELETE' })
      setContacts(prev => prev.filter(c => c.id !== contact.id))
    } finally {
      setDeleting(null)
    }
  }

  function openEdit(contact: Contact) {
    setEditing(contact)
    setShowModal(true)
  }

  function openNew() {
    setEditing(null)
    setShowModal(true)
  }

  const champion = contacts.find(c => c.isChampion)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0F1117]">Stakeholders</h2>
          {contacts.length > 0 && (
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={openNew}
          className="h-7 px-2.5 bg-[#4F6EF7] text-white rounded-lg text-xs font-medium hover:bg-[#4060E8] transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      {/* Champion callout */}
      {champion && (
        <div className="flex items-center gap-2 p-2.5 bg-[#FEF3E8]/50 border border-[#F58C37]/30 rounded-xl mb-3">
          <Icon icon={IconStar} size={16} className="text-[#F58C37]" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#F58C37] truncate">{champion.name}</p>
            {champion.title && <p className="text-[10px] text-[#9CA3AF] truncate">{champion.title}</p>}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-[#F7F8FC] rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-[#9CA3AF]">Sin stakeholders registrados</p>
          <button
            onClick={openNew}
            className="mt-2 text-xs text-[#4F6EF7] hover:underline"
          >
            <span className="inline-flex items-center gap-1">Agregar el primero <Icon icon={IconChevronRight} size={12} /></span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(contact => (
            <div key={contact.id} className={deleting === contact.id ? 'opacity-50 pointer-events-none' : ''}>
              <ContactCard
                contact={contact}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ContactModal
          accountId={accountId}
          contact={editing}
          onSaved={handleSaved}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
