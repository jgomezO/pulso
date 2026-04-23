'use client'

import { Chip } from '@heroui/react'
import { useHealthNarrative } from '@/hooks/useHealthNarrative'
import { formatRelative } from '@/lib/utils/date'
import { Icon } from '@/components/shared/Icon'
import { IconAI, IconRefresh } from '@/lib/icons'

interface HealthNarrativeCardProps {
  accountId: string
}

export function HealthNarrativeCard({ accountId }: HealthNarrativeCardProps) {
  const { narrative, generatedAt, isLoading, isRefreshing, error, refresh } =
    useHealthNarrative(accountId)

  if (error) {
    return (
      <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-4">
        <p className="text-xs text-[#9CA3AF]">No se pudo cargar el análisis.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-[#0F1117]">Análisis AI</span>
        <Chip size="sm" color="accent" variant="soft">AI</Chip>
        <div className="ml-auto flex items-center gap-2">
          {generatedAt && !isLoading && (
            <span className="text-[10px] text-[#9CA3AF]">
              {formatRelative(generatedAt)}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={isRefreshing || isLoading}
            className="p-1 rounded-md text-[#9CA3AF] hover:text-[#4F6EF7] hover:bg-[#EEF1FE] transition-colors disabled:opacity-50"
          >
            <Icon
              icon={IconRefresh}
              size={14}
              className={isRefreshing ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-4/6" />
        </div>
      ) : narrative ? (
        <p className="text-sm text-[#0F1117] leading-relaxed">{narrative}</p>
      ) : (
        <p className="text-xs text-[#9CA3AF]">
          Score no calculado. Configura las señales del Health Score para generar un análisis.
        </p>
      )}
    </div>
  )
}
