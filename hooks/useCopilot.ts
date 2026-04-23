'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  isError?: boolean
}

export interface ConversationSummary {
  id: string
  title: string
  isActive: boolean
  preview: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

const MAX_MESSAGES_PER_HOUR = 20

export function useCopilot(accountId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const messageCountRef = useRef<{ count: number; resetAt: number }>({
    count: 0,
    resetAt: Date.now() + 3600_000,
  })

  // Load active conversation and conversations list on mount
  useEffect(() => {
    loadConversations()
  }, [accountId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true)
    try {
      const res = await fetch(`/api/ai/copilot/conversations?accountId=${accountId}`)
      if (!res.ok) return
      const data = await res.json()
      const convos = data.conversations as ConversationSummary[]
      setConversations(convos)

      // Load active conversation if exists and we don't have messages
      const active = convos.find(c => c.isActive)
      if (active && messages.length === 0) {
        await loadConversation(active.id)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [accountId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ai/copilot/conversations/${id}`)
      if (!res.ok) return
      const data = await res.json()
      const msgs = (data.messages as { role: string; content: string; timestamp?: string }[])
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.timestamp,
        }))
      setMessages(msgs)
      setConversationId(data.id)
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    // Rate limit check
    const now = Date.now()
    if (now > messageCountRef.current.resetAt) {
      messageCountRef.current = { count: 0, resetAt: now + 3600_000 }
    }
    if (messageCountRef.current.count >= MAX_MESSAGES_PER_HOUR) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content },
        {
          role: 'assistant',
          content: 'Has alcanzado el límite de preguntas por hora. Intenta de nuevo más tarde.',
          isError: true,
        },
      ])
      return
    }
    messageCountRef.current.count++

    setMessages(prev => [...prev, { role: 'user', content }])
    setIsStreaming(true)
    setIsThinking(true)

    try {
      const history = messages
        .filter(m => !m.isError)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          message: content,
          conversationId,
          conversationHistory: history,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let assistantContent = ''
      let firstChunk = true

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (firstChunk) {
          setIsThinking(false)
          firstChunk = false
        }
        assistantContent += decoder.decode(value, { stream: true })
        const currentContent = assistantContent
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: currentContent }
          return updated
        })
      }

      // After successful message, refresh conversation list to get the new/updated conversation
      loadConversations()
    } catch (err) {
      console.error('Copilot error:', err)
      setIsThinking(false)
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Error al generar respuesta. Intenta de nuevo.',
            isError: true,
          }
          return updated
        }
        return [
          ...prev,
          {
            role: 'assistant',
            content: 'Error al generar respuesta. Intenta de nuevo.',
            isError: true,
          },
        ]
      })
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
    }
  }, [accountId, isStreaming, messages, conversationId, loadConversations])

  const startNewConversation = useCallback(async () => {
    // Archive current active
    await fetch('/api/ai/copilot/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    })
    setMessages([])
    setConversationId(null)
    loadConversations()
  }, [accountId, loadConversations])

  const switchConversation = useCallback(async (id: string) => {
    await loadConversation(id)
    loadConversations()
  }, [loadConversation, loadConversations])

  const clearChat = useCallback(async () => {
    await startNewConversation()
  }, [startNewConversation])

  return {
    messages,
    sendMessage,
    isStreaming,
    isThinking,
    clearChat,
    conversations,
    isLoadingConversations,
    conversationId,
    startNewConversation,
    switchConversation,
  }
}
