'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  {
    label: 'Inicio',
    href: '/',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Cuentas',
    href: '/accounts',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Tareas',
    href: '/tasks',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Health Score',
    href: '/settings/health-score',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Asistente AI',
    href: '/ai-chat',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    label: 'Integraciones',
    href: '/settings/integrations',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-[#ECEEF5] flex flex-col py-4 z-50 overflow-hidden transition-[width] duration-300"
      style={{ width: open ? 220 : 64 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3.5 mb-6 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#4F6EF7] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">P</span>
        </div>
        <span
          className={`text-sm font-bold text-[#0F1117] whitespace-nowrap transition-opacity duration-200 ${
            open ? 'opacity-100 delay-150' : 'opacity-0'
          }`}
        >
          Pulso
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 w-full px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={open ? undefined : item.label}
              className={`flex items-center rounded-xl h-10 transition-[padding,background-color,color] duration-300 ${
                open ? 'pl-2.5 pr-2.5' : 'pl-[14px] pr-[14px]'
              } ${
                isActive
                  ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                  : 'text-[#9CA3AF] hover:bg-[#F7F8FC] hover:text-[#6B7280]'
              }`}
            >
              {item.icon}
              <span
                className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-[opacity,max-width,margin] duration-300 ${
                  open ? 'opacity-100 max-w-[200px] ml-3 delay-100' : 'opacity-0 max-w-0 ml-0'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Toggle */}
      <button
        onClick={onToggle}
        title={open ? 'Contraer menú' : 'Expandir menú'}
        className={`mx-2 mb-1 h-9 rounded-xl flex items-center text-[#9CA3AF] hover:bg-[#F7F8FC] hover:text-[#6B7280] transition-[padding,background-color,color] duration-300 flex-shrink-0 ${
          open ? 'pl-2.5 pr-2.5' : 'pl-[14px] pr-[14px]'
        }`}
      >
        <svg
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        <span
          className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-[opacity,max-width,margin] duration-300 ${
            open ? 'opacity-100 max-w-[200px] ml-3 delay-100' : 'opacity-0 max-w-0 ml-0'
          }`}
        >
          Contraer
        </span>
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title={open ? undefined : 'Cerrar sesión'}
        className={`mx-2 h-9 rounded-xl flex items-center text-[#9CA3AF] hover:bg-[#F7F8FC] hover:text-[#6B7280] transition-[padding,background-color,color] duration-300 flex-shrink-0 ${
          open ? 'pl-2.5 pr-2.5' : 'pl-[14px] pr-[14px]'
        }`}
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span
          className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-[opacity,max-width,margin] duration-300 ${
            open ? 'opacity-100 max-w-[200px] ml-3 delay-100' : 'opacity-0 max-w-0 ml-0'
          }`}
        >
          Cerrar sesión
        </span>
      </button>
    </aside>
  )
}
