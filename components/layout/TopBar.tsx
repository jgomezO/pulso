'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, InputGroup, Dropdown, Avatar, Skeleton } from '@heroui/react'
import { Icon } from '@/components/shared/Icon'
import { IconSearch, IconCompany, IconContact, IconSettings, IconLogout, IconAI } from '@/lib/icons'
import { useAuthContext } from '@/components/providers/AuthProvider'

interface SearchResults {
  accounts: { id: string; name: string; domain: string | null }[]
  contacts: { id: string; name: string; email: string | null; account_name: string }[]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TopBar() {
  const router = useRouter()
  const { user, loading, signOut } = useAuthContext()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const userName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Usuario'
  const userEmail = user?.email ?? ''
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials = getInitials(userName)

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setResults(null)
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`)
        if (!res.ok) return
        const data = await res.json() as SearchResults
        setResults(data)
        setShowDropdown(true)
      } catch {
        // silent
      }
    }, 300)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const hasResults = results && (results.accounts.length > 0 || results.contacts.length > 0)

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#ECEEF5] flex items-center px-6 gap-4">

      {/* Left spacer */}
      <div className="flex-1" />

      {/* Search — centered, max 560px */}
      <div ref={searchRef} className="relative w-full max-w-[560px]">
        <TextField value={query} onChange={handleSearch} aria-label="Búsqueda global">
          <InputGroup variant="secondary" className="bg-white border border-[#ECEEF5] rounded-xl">
            <InputGroup.Prefix className="pl-3.5">
              <Icon icon={IconSearch} size={16} className="text-[#9CA3AF]" />
            </InputGroup.Prefix>
            <InputGroup.Input
              ref={inputRef}
              placeholder="Buscar cuentas, contactos, tareas..."
              className="h-10 text-sm placeholder:text-[#9CA3AF] bg-transparent border-none focus:ring-0 focus:outline-none"
            />
            <InputGroup.Suffix className="pr-2 flex items-center gap-1.5">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#ECEEF5] rounded-md">
                /
              </kbd>
              <button
                type="button"
                onClick={() => router.push('/ai-chat')}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#4F6EF7]/10 to-[#7C3AED]/10 hover:from-[#4F6EF7]/20 hover:to-[#7C3AED]/20 transition-all"
                aria-label="Chat con AI"
              >
                <Icon icon={IconAI} size={14} className="text-[#4F6EF7]" />
              </button>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>

        {showDropdown && query.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#ECEEF5] rounded-[14px] max-h-[400px] overflow-y-auto z-50">
            {hasResults ? (
              <div className="p-2">
                {results.accounts.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#9CA3AF] px-3 py-2 uppercase tracking-wider">
                      Cuentas
                    </p>
                    {results.accounts.map((a) => (
                      <button
                        key={a.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F8FC] text-left transition-colors"
                        onClick={() => {
                          router.push(`/accounts/${a.id}`)
                          setShowDropdown(false)
                          setQuery('')
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#4F6EF7]/10 flex items-center justify-center shrink-0">
                          <Icon icon={IconCompany} size={16} className="text-[#4F6EF7]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0F1117] truncate">{a.name}</p>
                          {a.domain && (
                            <p className="text-xs text-[#9CA3AF] truncate">{a.domain}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {results.contacts.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#9CA3AF] px-3 py-2 uppercase tracking-wider">
                      Contactos
                    </p>
                    {results.contacts.map((c) => (
                      <button
                        key={c.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F8FC] text-left transition-colors"
                        onClick={() => {
                          router.push(`/accounts?contact=${c.id}`)
                          setShowDropdown(false)
                          setQuery('')
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0">
                          <Icon icon={IconContact} size={16} className="text-[#6B7280]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0F1117] truncate">{c.name}</p>
                          {c.email && (
                            <p className="text-xs text-[#9CA3AF] truncate">{c.email}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-[#9CA3AF]">
                  No se encontraron resultados para &ldquo;{query}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right section: avatar */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {/* Avatar menu */}
        {loading ? (
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        ) : (
          <Dropdown>
            <Dropdown.Trigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]">
              <Avatar className="bg-[#4F6EF7] w-8 h-8 cursor-pointer flex-shrink-0">
                {avatarUrl && <Avatar.Image src={avatarUrl} alt={userName} />}
                <Avatar.Fallback className="text-white text-xs font-medium">
                  {initials}
                </Avatar.Fallback>
              </Avatar>
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu>
                <Dropdown.Section>
                  <Dropdown.Item id="profile" className="cursor-default opacity-100 focus:bg-transparent">
                    <p className="text-sm font-medium text-[#0F1117]">{userName}</p>
                    <p className="text-xs text-[#9CA3AF]">{userEmail}</p>
                  </Dropdown.Item>
                </Dropdown.Section>
                <Dropdown.Section>
                  <Dropdown.Item
                    id="settings"
                    href="/settings/profile"
                  >
                    <span className="flex items-center gap-2">
                      <Icon icon={IconSettings} size={16} />
                      Configuración
                    </span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="logout"
                    className="text-red-500 focus:text-red-500"
                    onAction={signOut}
                  >
                    <span className="flex items-center gap-2">
                      <Icon icon={IconLogout} size={16} />
                      Cerrar sesión
                    </span>
                  </Dropdown.Item>
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        )}
      </div>
    </header>
  )
}
