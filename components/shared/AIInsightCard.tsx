'use client'

import { Card, Chip } from '@heroui/react'

interface AIInsightCardProps {
  title: string
  content: string
  isStreaming?: boolean
  isLoading?: boolean
}

export function AIInsightCard({ title, content, isStreaming, isLoading }: AIInsightCardProps) {
  return (
    <Card className="border border-blue-100 bg-blue-50/30 dark:bg-blue-900/10">
      <Card.Header className="pb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          {title}
        </span>
        <Chip size="sm" color="accent" variant="soft">
          AI
        </Chip>
        {isStreaming && (
          <span className="ml-auto text-xs text-gray-400 animate-pulse">
            Generando...
          </span>
        )}
      </Card.Header>
      <Card.Content className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/5" />
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {content}
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-blue-500 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </p>
        )}
      </Card.Content>
    </Card>
  )
}
