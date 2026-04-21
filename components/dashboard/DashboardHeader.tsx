'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileSignature, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function DashboardHeader() {
  const router = useRouter()

  async function onSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="border-b border-ice bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sapphire rounded-lg flex items-center justify-center">
            <FileSignature size={16} strokeWidth={1.5} className="text-white" />
          </div>
          <span className="font-bold text-lg text-text-dark tracking-tight">OneContract</span>
        </Link>

        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text-dark transition-colors px-3 py-2 rounded-lg hover:bg-ice/50"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Выйти
        </button>
      </div>
    </header>
  )
}
