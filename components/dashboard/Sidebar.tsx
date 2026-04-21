'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileSignature, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getNavItems, isActive } from '@/lib/dashboard/nav'
import { useDashboardUser } from './DashboardUserContext'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useDashboardUser()
  const items = getNavItems(user.role)

  async function onSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-ice flex-col z-30">
      <div className="h-16 px-5 flex items-center border-b border-ice">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sapphire rounded-lg flex items-center justify-center">
            <FileSignature size={16} strokeWidth={1.5} className="text-white" />
          </div>
          <span className="font-bold text-base text-text-dark tracking-tight">OneContract</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon

          if (item.accent) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 bg-sapphire hover:bg-blue-700 text-white font-semibold text-sm px-3 py-2.5 rounded-xl transition-colors my-2"
              >
                <Icon size={18} strokeWidth={1.5} />
                {item.label}
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 text-sm px-3 py-2.5 rounded-xl transition-colors ${
                active
                  ? 'bg-ice text-sapphire font-semibold'
                  : 'text-muted hover:bg-gray-50 hover:text-text-dark font-medium'
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-ice p-3">
        <div className="px-2 py-2 mb-2">
          <p className="text-sm font-semibold text-text-dark truncate">{user.orgName}</p>
          <p className="text-xs text-muted truncate">{user.email}</p>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 text-sm text-muted hover:text-text-dark hover:bg-gray-50 font-medium px-3 py-2.5 rounded-xl transition-colors"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Выйти
        </button>
      </div>
    </aside>
  )
}
