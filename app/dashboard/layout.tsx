import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardUserProvider } from '@/components/dashboard/DashboardUserContext'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import type { DashboardUser } from '@/lib/dashboard/types'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const nameFromMeta =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null
  const name = nameFromMeta ?? (user.email ? user.email.split('@')[0] : 'Пользователь')
  const orgName = (user.user_metadata?.org_name as string | undefined) ?? 'Моя школа'

  const dashboardUser: DashboardUser = {
    id: user.id,
    email: user.email ?? '',
    name,
    role: 'owner',
    orgName,
    createdAt: user.created_at ?? new Date().toISOString(),
  }

  return (
    <DashboardUserProvider user={dashboardUser}>
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="lg:pl-[240px] min-h-screen flex flex-col">
          <DashboardHeader />
          <main className="flex-1 pb-24 lg:pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </DashboardUserProvider>
  )
}
