'use client'

import { useState, useEffect } from 'react'
import { Button, TextField, Input, TextArea, Select, ListBox, ListBoxItem, Skeleton } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconChevronRight, IconBack } from '@/lib/icons'
import { type CalendarDate } from '@internationalized/date'
import { DatePickerField } from '@/components/shared/DatePickerField'
import type { AccountTask, TaskStatus, TaskPriority } from '@/domain/task/AccountTask'
import { useUsers } from '@/hooks/useUsers'
import { formatDate } from '@/lib/utils/date'

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? ''

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  urgent: { label: 'Urgente', className: 'bg-[#FEE8E8] text-[#EF4444]' },
  high:   { label: 'Alta',    className: 'bg-[#FEF3E8] text-[#F58C37]' },
  medium: { label: 'Media',   className: 'bg-[#EEF1FE] text-[#4F6EF7]' },
  low:    { label: 'Baja',    className: 'bg-[#F7F8FC] text-[#6B7280]' },
}

// ── Due date label ────────────────────────────────────────────────────────────

function DueDateLabel({ dateStr }: { dateStr: string | null | undefined }) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(dateStr + 'T00:00:00')
  const diff  = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0)  return <span className="text-[11px] font-semibold text-[#EF4444]">Vencida · {formatDate(dateStr)}</span>
  if (diff === 0) return <span className="text-[11px] font-semibold text-[#4F6EF7]">Hoy</span>
  return <span className="text-[11px] text-[#9CA3AF]">{formatDate(dateStr)}</span>
}

// ── Initials avatar ───────────────────────────────────────────────────────────

function Avatar({ name }: { name?: string }) {
  if (!name) return null
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-5 h-5 rounded-full bg-[#EEF1FE] flex items-center justify-center flex-shrink-0" title={name}>
      <span className="text-[9px] font-semibold text-[#4F6EF7]">{initials}</span>
    </div>
  )
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  users,
  onUpdate,
  onDelete,
}: {
  task: AccountTask
  users: { id: string; name: string }[]
  onUpdate: (id: string, data: Partial<AccountTask>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [hovered,  setHovered]  = useState(false)
  const [checking, setChecking] = useState(false)
  const isCompleted  = task.status === 'completed'
  const assignedUser = users.find(u => u.id === task.assignedTo)
  const priority     = PRIORITY_CONFIG[task.priority]

  async function handleToggle() {
    setChecking(true)
    await onUpdate(task.id, { status: isCompleted ? 'pending' : 'completed' })
    setChecking(false)
  }

  return (
    <div
      className="bg-white border border-[#ECEEF5] rounded-xl p-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <Button
          isIconOnly
          size="sm"
         
          onPress={handleToggle}
          isDisabled={checking}
          className={`w-4 h-4 min-w-0 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-[#22C55E] border-[#22C55E]'
              : 'border-[#D1D5DB] hover:border-[#4F6EF7] bg-transparent'
          }`}
        >
          {isCompleted && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </Button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${isCompleted ? 'line-through text-[#9CA3AF]' : 'text-[#0F1117]'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${priority.className}`}>
              {priority.label}
            </span>
            <DueDateLabel dateStr={task.dueDate} />
          </div>
        </div>

        <Avatar name={assignedUser?.name} />
      </div>

      {/* Hover actions */}
      {hovered && !isCompleted && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-[#ECEEF5]">
          {task.status === 'pending' && (
            <Button
              size="sm"
             
              onPress={() => onUpdate(task.id, { status: 'in_progress' })}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EEF1FE] text-[#4F6EF7] hover:bg-[#4F6EF7] hover:text-white transition-colors min-w-0 h-auto"
            >
              <span className="inline-flex items-center gap-1"><Icon icon={IconChevronRight} size={10} /> En progreso</span>
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              size="sm"
             
              onPress={() => onUpdate(task.id, { status: 'pending' })}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F7F8FC] text-[#6B7280] hover:bg-[#ECEEF5] transition-colors min-w-0 h-auto"
            >
              <span className="inline-flex items-center gap-1"><Icon icon={IconBack} size={10} /> Pendiente</span>
            </Button>
          )}
          <Button
            size="sm"
           
            onPress={() => onDelete(task.id)}
            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FEE8E8] text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors ml-auto min-w-0 h-auto"
          >
            Eliminar
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Quick add form ────────────────────────────────────────────────────────────

function QuickAddForm({
  accountId,
  users,
  onAdded,
}: {
  accountId: string
  users: { id: string; name: string }[]
  onAdded: (task: AccountTask) => void
}) {
  const [title,       setTitle]       = useState('')
  const [priority,    setPriority]    = useState<TaskPriority>('medium')
  const [dueDate,     setDueDate]     = useState<CalendarDate | null>(null)
  const [assignedTo,  setAssignedTo]  = useState('')
  const [description, setDescription] = useState('')
  const [showExtra,   setShowExtra]   = useState(false)
  const [saving,      setSaving]      = useState(false)

  async function submit() {
    if (!title.trim()) return
    setSaving(true)
    const res = await fetch(`/api/accounts/${accountId}/tasks`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        title:       title.trim(),
        priority,
        dueDate:     dueDate?.toString() ?? null,
        assignedTo:  assignedTo || null,
        description: description.trim() || null,
      }),
    })
    setSaving(false)
    if (!res.ok) return
    const task = await res.json()
    onAdded(task)
    setTitle(''); setDueDate(null); setAssignedTo(''); setDescription('')
    setShowExtra(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    if (e.key === 'Escape') { setTitle(''); setShowExtra(false) }
  }

  const inputClass = "w-full bg-[#F7F8FC] border border-[#ECEEF5] rounded-xl px-3 text-sm text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4F6EF7] transition-colors"

  return (
    <div className="mt-2">
      <TextField value={title} onChange={setTitle} className="w-full">
        <Input
          placeholder="+ Añadir tarea (Enter para guardar)"
          onKeyDown={handleKeyDown}
          onFocus={() => setShowExtra(true)}
          className={`${inputClass} h-8`}
        />
      </TextField>
      {showExtra && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select.Root
              selectedKey={priority}
              onSelectionChange={key => setPriority((key as TaskPriority) ?? 'medium')}
              className="w-full"
            >
              <Select.Trigger className={`${inputClass} h-8 flex items-center justify-between px-2.5 cursor-pointer`}>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="low">Baja</ListBoxItem>
                  <ListBoxItem id="medium">Media</ListBoxItem>
                  <ListBoxItem id="high">Alta</ListBoxItem>
                  <ListBoxItem id="urgent">Urgente</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select.Root>

            <DatePickerField
              label="Fecha límite"
              value={dueDate}
              onChange={(date) => setDueDate((date ?? null) as CalendarDate | null)}
            />
          </div>

          {users.length > 0 && (
            <Select.Root
              selectedKey={assignedTo}
              onSelectionChange={key => setAssignedTo((key as string) ?? '')}
              className="w-full"
            >
              <Select.Trigger className={`${inputClass} h-8 flex items-center justify-between px-2.5 cursor-pointer`}>
                <Select.Value>{({ isPlaceholder }: { isPlaceholder: boolean }) => isPlaceholder ? 'Sin asignar' : undefined}</Select.Value>
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="">Sin asignar</ListBoxItem>
                  {users.map(u => <ListBoxItem key={u.id} id={u.id}>{u.name}</ListBoxItem>)}
                </ListBox>
              </Select.Popover>
            </Select.Root>
          )}

          <TextField value={description} onChange={setDescription} className="w-full">
            <TextArea
              placeholder="Descripción (opcional)"
              rows={2}
              className={`${inputClass} py-2 resize-none`}
            />
          </TextField>

          <div className="flex gap-2">
            <Button
              size="sm"
             
              onPress={submit}
              isDisabled={!title.trim() || saving}
              className="h-7 px-3 bg-[#4F6EF7] text-white rounded-lg text-xs font-medium hover:bg-[#3451D1] transition-colors disabled:opacity-40 min-w-0"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              size="sm"
             
              onPress={() => { setTitle(''); setShowExtra(false) }}
              className="h-7 px-3 bg-white border border-[#ECEEF5] text-[#6B7280] rounded-lg text-xs font-medium hover:border-[#9CA3AF] transition-colors min-w-0"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Columns ───────────────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending',     label: 'Pendientes',  color: 'text-[#6B7280]' },
  { status: 'in_progress', label: 'En progreso', color: 'text-[#4F6EF7]' },
  { status: 'completed',   label: 'Completadas', color: 'text-[#22C55E]' },
]

// ── Main component ────────────────────────────────────────────────────────────

interface TasksSectionProps {
  accountId: string
}

export function TasksSection({ accountId }: TasksSectionProps) {
  const [tasks,     setTasks]     = useState<AccountTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { users } = useUsers(ORG_ID)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res  = await fetch(`/api/accounts/${accountId}/tasks`)
      const json = await res.json()
      if (!cancelled) { setTasks(json.data ?? []); setIsLoading(false) }
    })()
    return () => { cancelled = true }
  }, [accountId])

  async function handleUpdate(id: string, data: Partial<AccountTask>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) return
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function handleDelete(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t =>
          col.status === 'completed'
            ? t.status === 'completed' || t.status === 'cancelled'
            : t.status === col.status
        )
        return (
          <div key={col.status}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                {col.label}
              </span>
              <span className="text-xs text-[#9CA3AF] bg-[#F7F8FC] px-1.5 py-0.5 rounded-md">
                {colTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {colTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  users={users}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
              {colTasks.length === 0 && (
                <div className="border border-dashed border-[#ECEEF5] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#9CA3AF]">Sin tareas</p>
                </div>
              )}
            </div>

            {col.status === 'pending' && (
              <QuickAddForm
                accountId={accountId}
                users={users}
                onAdded={task => setTasks(prev => [task, ...prev])}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
