'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface SidebarShellProps {
  children: React.ReactNode
}

export function SidebarShell({ children }: SidebarShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Sidebar open={open} onToggle={() => setOpen(o => !o)} />
      <div
        className="transition-[margin-left] duration-300"
        style={{ marginLeft: open ? 220 : 64 }}
      >
        <TopBar />
        <main className="h-[calc(100vh-64px)] overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </>
  )
}
