'use client'

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { Button, ScrollShadow } from '@heroui/react'
import Markdown from 'react-markdown'
import { Icon } from '@/components/shared/Icon'
import {
  IconClose, IconAI, IconSend, IconCopy, IconNewChat,
  IconConversations, IconCheck, IconThumbsUp, IconThumbsDown,
} from '@/lib/icons'
import { useCopilot, type ConversationSummary } from '@/hooks/useCopilot'
import { useInsights } from '@/hooks/useInsights'
import { getSuggestedQuestions } from '@/lib/copilot/suggestedQuestions'
import { parseActions } from '@/lib/copilot/actionParser'
import { ActionButtons, ActionConfirmation } from '@/components/copilot/CopilotActionForms'
import { InsightSection } from '@/components/copilot/InsightCards'
import { formatRelative } from '@/lib/utils/date'

interface CopilotDrawerProps {
  accountId: string
  accountName: string
  isOpen: boolean
  onClose: () => void
  account: {
    riskLevel: string | null
    renewalDate: string | null
    healthScore: number | null
    healthTrend: string | null
    contacts: { isChampion: boolean; lastContactedAt: string | null }[]
  }
}

const MD_COMPONENTS = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-xs font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-sm">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="text-xs bg-[#ECEEF5] px-1 py-0.5 rounded">{children}</code>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-1.5">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="border-b border-[#ECEEF5]">{children}</thead>,
  th: ({ children }: { children?: React.ReactNode }) => <th className="text-left px-2 py-1 text-[10px] font-semibold text-[#9CA3AF] uppercase">{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td className="px-2 py-1 border-b border-[#ECEEF5]">{children}</td>,
}

// ──────────── Sub-components ────────────

function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F8FC] rounded-[14px] rounded-bl-[4px]">
        <div className="w-5 h-5 rounded-full bg-[#EEF1FE] flex items-center justify-center flex-shrink-0">
          <Icon icon={IconAI} size={12} className="text-[#4F6EF7]" />
        </div>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-[#4F6EF7] rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-[#4F6EF7] rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-[#4F6EF7] rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button
      isIconOnly size="sm" variant="ghost" onPress={handleCopy}
      className="h-6 w-6 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#9CA3AF] hover:text-[#4F6EF7]"
    >
      <Icon icon={copied ? IconCheck : IconCopy} size={12} />
    </Button>
  )
}

function FeedbackButtons({
  conversationId,
  messageIndex,
}: {
  conversationId: string | null
  messageIndex: number
}) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)

  async function handleFeedback(value: 'positive' | 'negative') {
    if (!conversationId || rating) return
    setRating(value)
    await fetch('/api/ai/copilot/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, messageIndex, rating: value }),
    }).catch(() => {})
  }

  return (
    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        isIconOnly size="sm" variant="ghost"
        onPress={() => handleFeedback('positive')}
        isDisabled={rating !== null}
        className={`h-5 w-5 min-w-0 ${rating === 'positive' ? 'text-[#22C55E] opacity-100' : 'text-[#D1D5DB] hover:text-[#22C55E]'}`}
      >
        <Icon icon={IconThumbsUp} size={10} />
      </Button>
      <Button
        isIconOnly size="sm" variant="ghost"
        onPress={() => handleFeedback('negative')}
        isDisabled={rating !== null}
        className={`h-5 w-5 min-w-0 ${rating === 'negative' ? 'text-[#EF4444] opacity-100' : 'text-[#D1D5DB] hover:text-[#EF4444]'}`}
      >
        <Icon icon={IconThumbsDown} size={10} />
      </Button>
    </div>
  )
}

function ConversationList({
  conversations, currentId, onSelect, onClose,
}: {
  conversations: ConversationSummary[]
  currentId: string | null
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-[#ECEEF5] rounded-b-[14px] z-10 max-h-[300px] overflow-y-auto">
      {conversations.length === 0 ? (
        <p className="text-xs text-[#9CA3AF] text-center py-4">Sin conversaciones previas</p>
      ) : (
        conversations.map(c => (
          <button
            key={c.id} type="button"
            onClick={() => { onSelect(c.id); onClose() }}
            className={`w-full text-left px-4 py-2.5 border-b border-[#ECEEF5] last:border-0 hover:bg-[#F7F8FC] transition-colors ${c.id === currentId ? 'bg-[#EEF1FE]' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-[#0F1117] truncate">{c.title}</p>
              {c.isActive && (
                <span className="text-[9px] font-semibold text-[#4F6EF7] bg-[#EEF1FE] px-1.5 py-0.5 rounded flex-shrink-0">Activa</span>
              )}
            </div>
            <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">{c.preview}</p>
            <p className="text-[10px] text-[#D1D5DB] mt-0.5">{formatRelative(c.updatedAt)}</p>
          </button>
        ))
      )}
    </div>
  )
}

// ──────────── Main Drawer ────────────

export function CopilotDrawer({ accountId, accountName, isOpen, onClose, account }: CopilotDrawerProps) {
  const {
    messages, sendMessage, isStreaming, isThinking, clearChat,
    conversations, conversationId, startNewConversation, switchConversation,
  } = useCopilot(accountId)

  const {
    insights, unreadCount, dismiss: dismissInsight, markAllAsRead,
  } = useInsights(accountId)

  const [input, setInput] = useState('')
  const [showConversations, setShowConversations] = useState(false)
  const [confirmations, setConfirmations] = useState<Record<number, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestedQuestions = getSuggestedQuestions(account)

  // Mark insights as read when drawer opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAskAboutInsight(question: string) {
    sendMessage(`Cuéntame más sobre: ${question}`)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking, confirmations])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200)
    if (!isOpen) setShowConversations(false)
  }, [isOpen])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed)
    setInput('')
  }, [input, isStreaming, sendMessage])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleActionConfirmation(messageIndex: number, text: string) {
    setConfirmations(prev => ({ ...prev, [messageIndex]: text }))
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 lg:hidden cursor-pointer" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-[#ECEEF5] z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-[#ECEEF5]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#EEF1FE] flex items-center justify-center flex-shrink-0">
              <Icon icon={IconAI} size={16} className="text-[#4F6EF7]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0F1117]">Copilot</p>
              <p className="text-[11px] text-[#9CA3AF] truncate">{accountName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button isIconOnly size="sm" variant="ghost"
              onPress={() => setShowConversations(!showConversations)}
              className={`h-7 w-7 min-w-0 ${showConversations ? 'text-[#4F6EF7]' : 'text-[#9CA3AF]'} hover:text-[#4F6EF7]`}
            >
              <Icon icon={IconConversations} size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="ghost"
              onPress={startNewConversation}
              isDisabled={isStreaming || messages.length === 0}
              className="h-7 w-7 min-w-0 text-[#9CA3AF] hover:text-[#4F6EF7]"
            >
              <Icon icon={IconNewChat} size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="ghost" onPress={onClose}
              className="h-7 w-7 min-w-0 text-[#9CA3AF] hover:text-[#6B7280]"
            >
              <Icon icon={IconClose} size={16} />
            </Button>
          </div>

          {showConversations && (
            <ConversationList
              conversations={conversations} currentId={conversationId}
              onSelect={switchConversation} onClose={() => setShowConversations(false)}
            />
          )}
        </div>

        {/* Messages */}
        <ScrollShadow className="flex-1 overflow-y-auto py-4">
          {/* Proactive Insights */}
          <InsightSection
            insights={insights}
            onDismiss={dismissInsight}
            onAskCopilot={handleAskAboutInsight}
          />

          <div className="px-4">
          {messages.length === 0 && !isThinking ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
              <div className="w-10 h-10 rounded-full bg-[#EEF1FE] flex items-center justify-center">
                <Icon icon={IconAI} size={20} className="text-[#4F6EF7]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#0F1117]">Pregunta sobre {accountName}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Tengo acceso a todos los datos de esta cuenta</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} type="button"
                    className="px-3 py-1.5 text-[11px] text-[#6B7280] border border-[#ECEEF5] rounded-full hover:border-[#4F6EF7] hover:bg-[#EEF1FE] hover:text-[#4F6EF7] transition-colors"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => {
                const isLastStreaming = isStreaming && i === messages.length - 1
                const isCompleteAssistant = msg.role === 'assistant' && !msg.isError && !isLastStreaming && msg.content

                // Parse actions from completed assistant messages
                const { cleanText, actions } = isCompleteAssistant
                  ? parseActions(msg.content)
                  : { cleanText: msg.content, actions: [] }

                return (
                  <div key={i}>
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'user' ? (
                        <div className="max-w-[85%] px-3 py-2 text-sm whitespace-pre-wrap bg-[#4F6EF7] text-white rounded-[14px] rounded-br-[4px]">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="group relative max-w-[85%]">
                          <div className={`px-3 py-2 text-sm leading-relaxed rounded-[14px] rounded-bl-[4px] ${
                            msg.isError ? 'bg-[#FEE8E8] text-[#EF4444]' : 'bg-[#F7F8FC] text-[#0F1117]'
                          }`}>
                            <Markdown components={MD_COMPONENTS}>
                              {isLastStreaming ? msg.content : cleanText}
                            </Markdown>
                            {isLastStreaming && !isThinking && (
                              <span className="inline-block w-1.5 h-4 bg-[#4F6EF7] ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                            )}
                          </div>

                          {/* Toolbar: copy + feedback */}
                          {isCompleteAssistant && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <CopyButton text={cleanText} />
                              <FeedbackButtons conversationId={conversationId} messageIndex={i} />
                            </div>
                          )}

                          {/* Action buttons */}
                          {isCompleteAssistant && actions.length > 0 && !confirmations[i] && (
                            <ActionButtons
                              actions={actions}
                              accountId={accountId}
                              onConfirmation={(text) => handleActionConfirmation(i, text)}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action confirmation */}
                    {confirmations[i] && (
                      <div className="mt-2">
                        <ActionConfirmation text={confirmations[i]} />
                      </div>
                    )}
                  </div>
                )
              })}

              {isThinking && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
          </div>
        </ScrollShadow>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#ECEEF5]">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef} type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre esta cuenta..."
              className="flex-1 h-9 px-3 text-sm rounded-xl border border-[#ECEEF5] bg-white text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4F6EF7] disabled:opacity-50"
              disabled={isStreaming}
            />
            <Button isIconOnly size="sm" onPress={handleSend}
              isDisabled={!input.trim() || isStreaming}
              className="h-9 w-9 min-w-0 rounded-xl bg-[#4F6EF7] text-white disabled:opacity-40"
            >
              <Icon icon={IconSend} size={16} />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
