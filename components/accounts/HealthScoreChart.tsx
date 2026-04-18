'use client'

import useSWR from 'swr'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceArea,
} from 'recharts'

interface HistoryPoint {
  score: number
  calculated_at: string
  signals: Record<string, number | null> | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { date: string; score: number; signals: Record<string, number|null>|null } }[] }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-[#ECEEF5] rounded-xl p-2.5 text-xs shadow-sm">
      <p className="font-semibold text-[#0F1117] mb-1">{d.date}: Score {d.score}</p>
      {d.signals && (
        <div className="space-y-0.5 text-[#6B7280]">
          {d.signals.productUsageScore  != null && <p>Uso: {d.signals.productUsageScore}</p>}
          {d.signals.supportHealthScore != null && <p>Soporte: {d.signals.supportHealthScore}</p>}
          {d.signals.engagementScore    != null && <p>Engagement: {d.signals.engagementScore}</p>}
        </div>
      )}
    </div>
  )
}

export function HealthScoreChart({ accountId, currentScore }: { accountId: string; currentScore: number }) {
  const { data, isLoading } = useSWR<{ history: HistoryPoint[] }>(
    `/api/accounts/${accountId}/health-history?days=90`,
    fetcher
  )

  if (isLoading) {
    return <div className="h-[200px] bg-[#F7F8FC] rounded-xl animate-pulse" />
  }

  const history = data?.history ?? []
  if (history.length < 3) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <p className="text-xs text-[#9CA3AF]">Se necesitan más mediciones para mostrar la tendencia</p>
      </div>
    )
  }

  const chartData = history.map(h => ({
    date:    fmtDate(h.calculated_at),
    score:   h.score,
    signals: h.signals,
  }))

  const lineColor = currentScore >= 70 ? '#22C55E' : currentScore >= 40 ? '#F58C37' : '#EF4444'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <ReferenceArea y1={70} y2={100} fill="#22C55E" fillOpacity={0.05} />
        <ReferenceArea y1={40} y2={70}  fill="#F58C37" fillOpacity={0.05} />
        <ReferenceArea y1={0}  y2={40}  fill="#EF4444" fillOpacity={0.05} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          tickLine={false}
          axisLine={false}
          ticks={[0, 25, 50, 75, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
