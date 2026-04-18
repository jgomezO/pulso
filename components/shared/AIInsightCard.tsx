'use client'

import Markdown from 'react-markdown'
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
          <div className="text-sm text-[#0F1117] leading-relaxed">
            <Markdown
              components={{
                h1: ({ children }) => <h1 className="text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-semibold mt-3 mb-1 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="w-full text-xs border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="border-b border-[#ECEEF5]">{children}</thead>,
                th: ({ children }) => <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase">{children}</th>,
                td: ({ children }) => <td className="px-2 py-1.5 border-b border-[#ECEEF5]">{children}</td>,
              }}
            >
              {content}
            </Markdown>
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-[#4F6EF7] ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  )
}
