'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Markdown from 'react-markdown'
import { Button, Input, Spinner } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconAI, IconTasks, IconPlan, IconNote, IconCall, IconMeeting, IconEmail, IconCheck } from '@/lib/icons'

interface ToolAction {
  tool: string
  input: Record<string, unknown>
  status: 'pending' | 'executed' | 'error'
  result?: Record<string, unknown>
  error?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: ToolAction[]
}

const TOOL_LABELS: Record<string, string> = {
  create_task: 'Tarea creada',
  create_plan: 'Plan creado',
  log_activity: 'Actividad registrada',
}

const TOOL_ICONS: Record<string, typeof IconTasks> = {
  create_task: IconTasks,
  create_plan: IconPlan,
  log_activity: IconNote,
}

const ACTIVITY_ICONS: Record<string, typeof IconNote> = {
  note: IconNote,
  email: IconEmail,
  call: IconCall,
  meeting: IconMeeting,
}

export default function AIChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: Message = { role: 'user', content: text }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Request failed')

      const data = await res.json() as { message: string; actions?: ToolAction[] }
      setMessages([
        ...updated,
        { role: 'assistant', content: data.message, actions: data.actions },
      ])
    } catch {
      setMessages([
        ...updated,
        { role: 'assistant', content: 'Error al obtener respuesta. Intenta de nuevo.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function getActionLink(action: ToolAction): string | null {
    if (action.status !== 'executed' || !action.result) return null
    const accountId = action.result.accountId as string
    if (!accountId) return null
    return `/accounts/${accountId}`
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] -m-6 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#ECEEF5] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[14px] bg-[#EEF1FE] flex items-center justify-center">
            <Icon icon={IconAI} size={20} className="text-[#4F6EF7]" />
          </div>
          <h1 className="text-lg font-semibold text-[#0F1117]">Asistente AI</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-[14px] bg-[#EEF1FE] flex items-center justify-center mb-4">
              <Icon icon={IconAI} size={28} className="text-[#4F6EF7]" />
            </div>
            <p className="text-sm font-medium text-[#0F1117] mb-2">
              Conozco tu portafolio
            </p>
            <p className="text-sm text-[#6B7280] max-w-md mb-6">
              Tengo acceso a tus cuentas, health scores, tareas, renovaciones y actividad reciente.
              Puedo crear tareas, planes y registrar actividades directamente.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {[
                'Cuentas en riesgo y qué hacer',
                'Crea tareas de seguimiento para cuentas críticas',
                'Registra una nota para mi cuenta más grande',
                'Crea un plan de rescate para la cuenta con peor score',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-xs font-medium text-[#4F6EF7] bg-[#EEF1FE] rounded-lg hover:bg-[#DDE3FD] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
              {/* Message bubble */}
              <div
                className={`rounded-[14px] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#4F6EF7] text-white whitespace-pre-wrap'
                    : 'bg-white border border-[#ECEEF5] text-[#0F1117] prose prose-sm prose-neutral'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <Markdown
                    components={{
                      h1: ({ children }) => <h1 className="text-base font-semibold text-[#0F1117] mt-3 mb-1 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-semibold text-[#0F1117] mt-3 mb-1 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold text-[#0F1117] mt-2 mb-1 first:mt-0">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-[#0F1117]">{children}</strong>,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                          <table className="w-full text-xs border-collapse">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="border-b border-[#ECEEF5]">{children}</thead>,
                      th: ({ children }) => <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase">{children}</th>,
                      td: ({ children }) => <td className="px-2 py-1.5 border-b border-[#ECEEF5]">{children}</td>,
                      code: ({ children }) => <code className="bg-[#F7F8FC] px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-[#F7F8FC] rounded-lg p-3 overflow-x-auto my-2 text-xs">{children}</pre>,
                    }}
                  >
                    {msg.content}
                  </Markdown>
                ) : (
                  msg.content
                )}
              </div>

              {/* Tool actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-col gap-2 w-full">
                  {msg.actions.map((action, j) => {
                    const link = getActionLink(action)
                    const icon = action.tool === 'log_activity'
                      ? ACTIVITY_ICONS[action.input.type as string] ?? IconNote
                      : TOOL_ICONS[action.tool] ?? IconTasks

                    return (
                      <div
                        key={j}
                        className="flex items-center gap-3 px-4 py-3 bg-white border border-[#ECEEF5] rounded-[14px]"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          action.status === 'executed' ? 'bg-emerald-50' : 'bg-red-50'
                        }`}>
                          <Icon
                            icon={action.status === 'executed' ? IconCheck : icon}
                            size={16}
                            className={action.status === 'executed' ? 'text-emerald-600' : 'text-red-500'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0F1117] truncate">
                            {TOOL_LABELS[action.tool] ?? action.tool}
                          </p>
                          <p className="text-xs text-[#6B7280] truncate">
                            {(action.input.title as string)} — {(action.input.account_name as string)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center h-6 px-2 rounded-md text-[11px] font-medium ${
                            action.status === 'executed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {action.status === 'executed' ? 'Completado' : 'Error'}
                          </span>
                          {link && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 min-w-0 px-3 text-xs text-[#4F6EF7] bg-[#EEF1FE]"
                              onPress={() => router.push(link)}
                            >
                              Ver
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#ECEEF5] rounded-[14px] px-4 py-3 flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-[#9CA3AF]">Pensando...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 py-4 border-t border-[#ECEEF5] bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje... (puedo crear tareas, planes y registrar actividades)"
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            isDisabled={!input.trim() || isLoading}
            className="bg-[#4F6EF7] text-white rounded-xl px-6"
          >
            Enviar
          </Button>
        </form>
      </div>
    </div>
  )
}
