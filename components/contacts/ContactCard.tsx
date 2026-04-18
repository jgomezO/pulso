'use client'

import type { Contact } from '@/domain/contact/Contact'
import { Icon } from '@/components/shared/Icon'
import { IconStar } from '@/lib/icons'

const ROLE_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  champion:       { label: 'Champion',       className: 'bg-[#FEF3E8] text-[#F58C37]' },
  decision_maker: { label: 'Decision Maker', className: 'bg-[#F0EEFF] text-[#6C4EF2]' },
  executive:      { label: 'Ejecutivo',      className: 'bg-[#EEF1FE] text-[#4F6EF7]' },
  technical:      { label: 'Técnico',        className: 'bg-[#E8FAF0] text-[#22C55E]' },
  billing:        { label: 'Billing',        className: 'bg-[#F7F8FC] text-[#6B7280]' },
  user:           { label: 'Usuario',        className: 'bg-[#F7F8FC] text-[#9CA3AF]' },
}

const INFLUENCE_DOT: Record<string, string> = {
  high:   'bg-[#22C55E]',
  medium: 'bg-[#F58C37]',
  low:    'bg-[#9CA3AF]',
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:   { label: 'Activo',    className: 'text-[#22C55E]' },
  new:      { label: 'Nuevo',     className: 'text-[#4F6EF7]' },
  inactive: { label: 'Inactivo',  className: 'text-[#9CA3AF]' },
  churned:  { label: 'Churned',   className: 'text-[#EF4444]' },
}

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const initials = contact.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const roleConfig   = ROLE_TYPE_CONFIG[contact.roleType ?? 'user'] ?? ROLE_TYPE_CONFIG.user
  const influenceDot = INFLUENCE_DOT[contact.influenceLevel ?? 'medium'] ?? INFLUENCE_DOT.medium
  const statusCfg    = STATUS_CONFIG[contact.relationshipStatus ?? 'active'] ?? STATUS_CONFIG.active
  const isChampion   = contact.isChampion

  return (
    <div
      className={`bg-white rounded-[14px] p-4 border transition-shadow hover:shadow-sm ${
        isChampion ? 'border-[#F58C37] ring-1 ring-[#F58C37]/20' : 'border-[#ECEEF5]'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#EEF1FE] text-[#4F6EF7] flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-[#0F1117] truncate">{contact.name}</p>
            {isChampion && (
              <Icon icon={IconStar} size={12} className="text-[#F58C37]" />
            )}
          </div>
          {contact.title && (
            <p className="text-xs text-[#6B7280] mt-0.5 truncate">{contact.title}</p>
          )}
          {contact.email && (
            <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">{contact.email}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(contact)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#EEF1FE] hover:text-[#4F6EF7] transition-colors"
            title="Editar"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(contact)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#FEE8E8] hover:text-[#EF4444] transition-colors"
            title="Eliminar"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleConfig.className}`}>
          {roleConfig.label}
        </span>

        {/* Influence level dot */}
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${influenceDot}`} />
          <span className="text-[10px] text-[#9CA3AF] capitalize">
            {contact.influenceLevel === 'high' ? 'Alta' : contact.influenceLevel === 'medium' ? 'Media' : 'Baja'} influencia
          </span>
        </div>

        <span className={`text-[10px] font-medium ml-auto ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Phone */}
      {contact.phone && (
        <p className="text-[11px] text-[#9CA3AF] mt-2">{contact.phone}</p>
      )}
    </div>
  )
}
