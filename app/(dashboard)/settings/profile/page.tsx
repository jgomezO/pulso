'use client'

import { useState, useEffect, useMemo } from 'react'
import { TextField, Input, Label, Button, Avatar, Chip, Skeleton, Description } from '@heroui/react'
import { toast } from '@heroui/react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useUserProfile } from '@/hooks/useUserProfile'
import { createClient } from '@/lib/supabase/client'

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuthContext()
  const { profile, isLoading: profileLoading } = useUserProfile()

  const currentName = (user?.user_metadata?.full_name as string | undefined) ?? ''
  const currentJobTitle = (user?.user_metadata?.job_title as string | undefined) ?? ''
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const email = user?.email ?? ''

  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      setFullName(currentName)
      setJobTitle(currentJobTitle)
    }
  }, [authLoading, user, currentName, currentJobTitle])

  const isDirty = useMemo(
    () => fullName !== currentName || jobTitle !== currentJobTitle,
    [fullName, currentName, jobTitle, currentJobTitle]
  )

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim(), job_title: jobTitle.trim() },
      })
      if (error) {
        toast.danger('No se pudieron guardar los cambios')
      } else {
        toast.success('Perfil actualizado correctamente')
      }
    } catch {
      toast.danger('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const isLoading = authLoading || profileLoading

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-[#0F1117] mb-6">Mi perfil</h1>

      <div className="space-y-4">
        {/* Card 1 — Información personal */}
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-6">
          <p className="text-sm font-semibold text-[#0F1117] mb-5">Información personal</p>

          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-4 rounded-lg" />
                  <Skeleton className="w-48 h-3 rounded-lg" />
                </div>
              </div>
              <Skeleton className="w-full h-10 rounded-xl" />
              <Skeleton className="w-full h-10 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Avatar + info */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16 bg-[#4F6EF7]">
                  {avatarUrl && <Avatar.Image src={avatarUrl} alt={fullName || 'Avatar'} />}
                  <Avatar.Fallback className="text-white text-lg font-semibold">
                    {getInitials(fullName || email)}
                  </Avatar.Fallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-[#0F1117]">{fullName || email}</p>
                  <p className="text-xs text-[#9CA3AF]">{email}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <TextField
                  value={fullName}
                  onChange={setFullName}
                  className="w-full"
                >
                  <Label className="block text-sm font-medium text-[#0F1117] mb-1">
                    Nombre completo
                  </Label>
                  <Input
                    placeholder="Tu nombre"
                    className="w-full border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]"
                  />
                </TextField>

                <TextField
                  value={email}
                  isReadOnly
                  className="w-full"
                >
                  <Label className="block text-sm font-medium text-[#0F1117] mb-1">
                    Email
                  </Label>
                  <Input
                    className="w-full border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm bg-[#F7F8FC] text-[#9CA3AF] cursor-not-allowed"
                  />
                  <Description className="text-xs text-[#9CA3AF] mt-1">
                    El email se gestiona desde tu cuenta de Google
                  </Description>
                </TextField>

                <TextField
                  value={jobTitle}
                  onChange={setJobTitle}
                  className="w-full"
                >
                  <Label className="block text-sm font-medium text-[#0F1117] mb-1">
                    Cargo / Título
                  </Label>
                  <Input
                    placeholder="Customer Success Manager"
                    className="w-full border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]"
                  />
                </TextField>

                <div className="pt-2">
                  <Button
                    onPress={handleSave}
                    isDisabled={!isDirty || saving}
                    className={`px-5 h-10 rounded-xl text-sm font-medium text-white transition-colors ${
                      isDirty && !saving
                        ? 'bg-[#4F6EF7] hover:bg-[#3D5BD9]'
                        : 'bg-[#4F6EF7]/50 cursor-not-allowed'
                    }`}
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Card 2 — Organización y rol */}
        <div className="bg-white border border-[#ECEEF5] rounded-[14px] p-6">
          <p className="text-sm font-semibold text-[#0F1117] mb-5">Organización</p>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="w-48 h-10 rounded-xl" />
              <Skeleton className="w-32 h-6 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              <TextField
                value={profile?.orgName ?? 'Sin organización'}
                isReadOnly
                className="w-full"
              >
                <Label className="block text-sm font-medium text-[#0F1117] mb-1">
                  Organización
                </Label>
                <Input
                  className="w-full border border-[#ECEEF5] rounded-xl px-3 py-2 text-sm bg-[#F7F8FC] text-[#9CA3AF] cursor-not-allowed"
                />
              </TextField>

              <div>
                <p className="text-sm font-medium text-[#0F1117] mb-2">Rol</p>
                <Chip
                  color={profile?.role === 'admin' ? 'accent' : 'default'}
                  variant="soft"
                  className={
                    profile?.role === 'admin'
                      ? 'bg-[#EEF1FE] text-[#4F6EF7]'
                      : 'bg-[#F7F8FC] text-[#6B7280]'
                  }
                >
                  <Chip.Label className="text-xs font-medium capitalize">
                    {profile?.role ?? 'member'}
                  </Chip.Label>
                </Chip>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
