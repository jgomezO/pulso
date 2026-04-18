import { Chip } from '@heroui/react'
import type { Contact } from '@/domain/contact/Contact'
import { formatRelative } from '@/lib/utils/date'

interface ContactMapProps {
  contacts: Contact[]
}

export function ContactMap({ contacts }: ContactMapProps) {
  if (contacts.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No hay contactos registrados.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-700">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-800 truncate">
                {contact.name}
              </span>
              {contact.isChampion && (
                <Chip size="sm" color="success" variant="soft">
                  Champion
                </Chip>
              )}
              {contact.isDecisionMaker && (
                <Chip size="sm" color="warning" variant="soft">
                  Decision Maker
                </Chip>
              )}
            </div>
            {contact.role && (
              <p className="text-xs text-gray-500">{contact.role}</p>
            )}
            {contact.email && (
              <p className="text-xs text-gray-400 truncate">{contact.email}</p>
            )}
            {contact.lastActivityAt && (
              <p className="text-xs text-gray-400 mt-1">
                Última actividad: {formatRelative(contact.lastActivityAt)}
              </p>
            )}
          </div>
          {contact.engagementScore != null && (
            <div className="text-right flex-shrink-0">
              <span
                className={`text-sm font-semibold ${
                  contact.engagementScore >= 70
                    ? 'text-green-600'
                    : contact.engagementScore >= 40
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {contact.engagementScore}
              </span>
              <p className="text-xs text-gray-400">engage</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
