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

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <SidebarShell>
        {children}
      </SidebarShell>
    </div>
  )
}
