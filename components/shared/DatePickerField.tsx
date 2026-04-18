'use client'

import { DatePicker, DateField, Calendar } from '@heroui/react'
import type { DateValue } from '@internationalized/date'

interface DatePickerFieldProps {
  label: string
  value: DateValue | null
  onChange: (value: DateValue | null) => void
  className?: string
}

export function DatePickerField({ label, value, onChange, className }: DatePickerFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 w-full min-w-[200px] ${className ?? ''}`}>
      <span className="block text-sm font-medium text-[#0F1117]">{label}</span>
      <DatePicker.Root
        value={value ?? undefined}
        onChange={(date) => onChange(date ?? null)}
        granularity="day"
        className="w-full"
      >
        <DateField.Group className="w-full">
          <DateField.InputContainer className="flex-1">
            <DateField.Input className="flex gap-0.5 text-sm">
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.InputContainer>
          <DateField.Suffix>
            <DatePicker.Trigger className="flex items-center justify-center px-2 text-[#9CA3AF] hover:text-[#4F6EF7] transition-colors flex-shrink-0 outline-none bg-transparent border-none cursor-pointer">
              <DatePicker.TriggerIndicator>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </DatePicker.TriggerIndicator>
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>

        <DatePicker.Popover>
          <Calendar>
            <Calendar.Header>
              <Calendar.NavButton slot="previous" />
              <Calendar.Heading />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => <Calendar.Cell date={date} />}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker.Root>
    </div>
  )
}
