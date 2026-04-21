'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getMobileNavItems, isActive } from '@/lib/dashboard/nav'
import { useDashboardUser } from './DashboardUserContext'

export function MobileBottomNav() {
  const pathname = usePathname()
  const user = useDashboardUser()
  const items = getMobileNavItems(user.role)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ice">
      <div className="flex items-center justify-around h-16 px-2 safe-area-pb">
        {items.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon

          if (item.accent) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="-mt-4 flex items-center justify-center w-12 h-12 rounded-full bg-sapphire hover:bg-blue-700 text-white shadow-lg shadow-sapphire/30 transition-colors"
                aria-label={item.label}
              >
                <Icon size={22} strokeWidth={1.5} />
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
                active ? 'text-sapphire' : 'text-muted hover:text-text-dark'
              }`}
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="mt-1 truncate max-w-[60px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
