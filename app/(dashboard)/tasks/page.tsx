'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Table } from '@heroui/react'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { AccountTask, TaskStatus, TaskPriority } from '@/domain/task/AccountTask'
import { formatDate } from '@/lib/utils/date'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', className: 'bg-[#FEE8E8] text-[#EF4444]' },
  high:   { label: 'Alta',    className: 'bg-[#FEF3E8] text-[#F58C37]' },
  medium: { label: 'Media',   className: 'bg-[#EEF1FE] text-[#4F6EF7]' },
  low:    { label: 'Baja',    className: 'bg-[#F7F8FC] text-[#6B7280]' },
} as const

const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',   className: 'bg-[#F7F8FC] text-[#6B7280]'  },
  in_progress: { label: 'En progreso', className: 'bg-[#EEF1FE] text-[#4F6EF7]' },
  completed:   { label: 'Completada',  className: 'bg-[#E8FAF0] text-[#22C55E]' },
  cancelled:   { label: 'Cancelada',   className: 'bg-[#F7F8FC] text-[#9CA3AF]' },
} as const

function DueDateCell({ dateStr }: { dateStr: string | null | undefined }) {
  if (!dateStr) return <span className="text-[#9CA3AF]">—</span>
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(dateStr + 'T00:00:00')
  const diff  = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0)  return <span className="text-sm font-semibold text-[#EF4444]">{formatDate(dateStr)}</span>
  if (diff === 0) return <span className="text-sm font-semibold text-[#4F6EF7]">Hoy</span>
  return <span className="text-sm text-[#6B7280]">{formatDate(dateStr)}</span>
}

type FilterStatus   = TaskStatus | ''
type FilterPriority = TaskPriority | ''

export default function TasksPage() {
  const { userId, isLoading: userLoading } = useCurrentUser()
  const [tasks,          setTasks]          = useState<AccountTask[]>([])
  const [isLoading,      setIsLoading]      = useState(true)
  const [statusFilter,   setStatusFilter]   = useState<FilterStatus>('pending')
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      setIsLoading(true)
      const p = new URLSearchParams({ userId, pageSize: '100' })
      if (statusFilter)   p.set('status',   statusFilter)
      if (priorityFilter) p.set('priority', priorityFilter)
      try {
        const r = await fetch(`/api/tasks?${p}`)
        const json = await r.json()
        if (!cancelled) { setTasks(json.data ?? []); setIsLoading(false) }
      } catch {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId, statusFilter, priorityFilter])

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    if (!res.ok) return
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
  }

  async function handleDelete(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
    { value: '',            label: 'Todas'       },
    { value: 'pending',     label: 'Pendientes'  },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'completed',   label: 'Completadas' },
  ]

  const PRIORITY_FILTERS: { value: FilterPriority; label: string }[] = [
    { value: '',       label: 'Todas'   },
    { value: 'urgent', label: 'Urgente' },
    { value: 'high',   label: 'Alta'    },
    { value: 'medium', label: 'Media'   },
    { value: 'low',    label: 'Baja'    },
  ]

  return (
    <div>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 items-center">
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mr-1">Estado</span>
            {STATUS_FILTERS.map(f => (
              <Button
                key={f.value}
                size="sm"
               
                onPress={() => setStatusFilter(f.value)}
                className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-colors min-w-0 ${
                  statusFilter === f.value
                    ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                    : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
                }`}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-1 items-center">
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mr-1">Prioridad</span>
            {PRIORITY_FILTERS.map(f => (
              <Button
                key={f.value}
                size="sm"
               
                onPress={() => setPriorityFilter(f.value)}
                className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-colors min-w-0 ${
                  priorityFilter === f.value
                    ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                    : 'bg-white border border-[#ECEEF5] text-[#6B7280] hover:border-[#4F6EF7] hover:text-[#4F6EF7]'
                }`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading || userLoading ? (
          <TableSkeleton rows={6} />
        ) : tasks.length === 0 ? (
          <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-8 text-center">
            <p className="text-sm text-[#9CA3AF]">No hay tareas con estos filtros.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#ECEEF5] rounded-[14px] overflow-hidden">
            <Table.Root>
              <Table.Content aria-label="Tasks table">
              <Table.Header>
                <Table.Column isRowHeader className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Cuenta</Table.Column>
                <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Tarea</Table.Column>
                <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Prioridad</Table.Column>
                <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Vencimiento</Table.Column>
                <Table.Column className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#ECEEF5]">Estado</Table.Column>
                <Table.Column className="px-4 py-3 border-b border-[#ECEEF5]">{' '}</Table.Column>
              </Table.Header>
              <Table.Body>
                {tasks.map(task => {
                  const prio   = PRIORITY_CONFIG[task.priority]
                  const status = STATUS_CONFIG[task.status]
                  return (
                    <Table.Row key={task.id} className="border-b border-[#ECEEF5] last:border-0 hover:bg-[#F7F8FC] transition-colors">
                      <Table.Cell className="px-4 py-3">
                        {task.accountName ? (
                          <Link href={`/accounts/${task.accountId}`} className="text-sm font-medium text-[#4F6EF7] hover:underline">
                            {task.accountName}
                          </Link>
                        ) : <span className="text-sm text-[#9CA3AF]">—</span>}
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3">
                        <p className={`text-sm ${task.status === 'completed' ? 'line-through text-[#9CA3AF]' : 'text-[#0F1117]'}`}>
                          {task.title}
                        </p>
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${prio.className}`}>
                          {prio.label}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3">
                        <DueDateCell dateStr={task.dueDate} />
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${status.className}`}>
                          {status.label}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          {task.status !== 'completed' && (
                            <Button
                              isIconOnly
                              size="sm"
                             
                              onPress={() => handleStatusChange(task.id, 'completed')}
                              className="h-6 px-2 bg-[#E8FAF0] text-[#22C55E] rounded-md text-[10px] font-semibold hover:bg-[#22C55E] hover:text-white transition-colors min-w-0"
                            >
                              ✓
                            </Button>
                          )}
                          <Button
                            isIconOnly
                            size="sm"
                           
                            onPress={() => handleDelete(task.id)}
                            className="h-6 px-2 bg-[#FEE8E8] text-[#EF4444] rounded-md text-[10px] font-semibold hover:bg-[#EF4444] hover:text-white transition-colors min-w-0"
                          >
                            ×
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
              </Table.Content>
            </Table.Root>
          </div>
        )}
      </div>
    </div>
  )
}
