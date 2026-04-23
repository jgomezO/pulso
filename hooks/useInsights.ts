'use client'

import { useState, useCallback, useEffect } from 'react'

export interface Insight {
  id: string
  account_id: string
  org_id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  data: Record<string, unknown>
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  expires_at: string | null
}

export function useInsights(accountId: string) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchInsights = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}/insights`)
      if (!res.ok) return
      const data = await res.json()
      const items = data.insights as Insight[]
      setInsights(items)
      setUnreadCount(items.filter(i => !i.is_read).length)
    } catch (err) {
      console.error('Failed to fetch insights:', err)
    } finally {
      setIsLoading(false)
    }
  }, [accountId])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/insights/count?accountId=${accountId}`)
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.count ?? 0)
    } catch {
      // silent
    }
  }, [accountId])

  const generateInsights = useCallback(async () => {
    try {
      await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      await fetchInsights()
    } catch (err) {
      console.error('Failed to generate insights:', err)
    }
  }, [accountId, fetchInsights])

  const markAsRead = useCallback(async (insightId: string) => {
    try {
      await fetch(`/api/insights/${insightId}/read`, { method: 'PATCH' })
      setInsights(prev => prev.map(i => i.id === insightId ? { ...i, is_read: true } : i))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }, [])

  const dismiss = useCallback(async (insightId: string) => {
    try {
      await fetch(`/api/insights/${insightId}/dismiss`, { method: 'PATCH' })
      setInsights(prev => prev.filter(i => i.id !== insightId))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unread = insights.filter(i => !i.is_read)
    await Promise.all(unread.map(i => fetch(`/api/insights/${i.id}/read`, { method: 'PATCH' })))
    setInsights(prev => prev.map(i => ({ ...i, is_read: true })))
    setUnreadCount(0)
  }, [insights])

  // Generate + fetch on mount
  useEffect(() => {
    generateInsights()
  }, [accountId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch unread count periodically (for badge)
  useEffect(() => {
    fetchUnreadCount()
  }, [accountId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    insights,
    unreadCount,
    isLoading,
    fetchInsights,
    fetchUnreadCount,
    generateInsights,
    markAsRead,
    markAllAsRead,
    dismiss,
  }
}
