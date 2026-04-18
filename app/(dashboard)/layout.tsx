import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarShell } from '@/components/layout/SidebarShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Usuario'
  const userEmail = user.email ?? ''

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <SidebarShell userName={userName} userEmail={userEmail}>
        {children}
      </SidebarShell>
    </div>
  )
}
