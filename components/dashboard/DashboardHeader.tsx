'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileSignature, LogOut, User as UserIcon, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDashboardUser } from './DashboardUserContext'

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div className="w-8 h-8 rounded-full bg-sapphire text-white text-sm font-semibold flex items-center justify-center">
      {initial}
    </div>
  )
}

export function DashboardHeader() {
  const router = useRouter()
  const user = useDashboardUser()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function onSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-ice lg:border-b-0">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-sapphire rounded-lg flex items-center justify-center">
            <FileSignature size={16} strokeWidth={1.5} className="text-white" />
          </div>
          <span className="font-bold text-base text-text-dark tracking-tight">OneContract</span>
        </Link>

        <div className="hidden lg:block" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-xl transition-colors"
          >
            <Avatar name={user.name} />
            <span className="hidden sm:inline text-sm font-medium text-text-dark">{user.name}</span>
            <ChevronDown size={14} strokeWidth={1.5} className="hidden sm:block text-muted" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-ice rounded-xl shadow-lg shadow-navy/8 py-1.5 overflow-hidden">
              <div className="px-3 py-2 border-b border-ice mb-1">
                <p className="text-sm font-semibold text-text-dark truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-gray-50 transition-colors"
              >
                <UserIcon size={16} strokeWidth={1.5} className="text-muted" />
                Профиль
              </Link>
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-gray-50 transition-colors"
              >
                <LogOut size={16} strokeWidth={1.5} className="text-muted" />
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
