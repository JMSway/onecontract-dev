'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileSignature, Loader2 } from 'lucide-react'
import { signInWithEmail } from '@/lib/supabase-auth'
import { GoogleButton } from '@/components/auth/GoogleButton'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmail(email, password)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-ice via-white to-ice px-4 py-12">
      <p className="text-xs text-muted text-center mb-6">Электронные договоры для школ</p>

      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-sapphire rounded-[10px] flex items-center justify-center">
          <FileSignature size={18} strokeWidth={1.5} className="text-white" />
        </div>
        <span className="font-bold text-xl text-text-dark tracking-tight">OneContract</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="bg-white border border-ice rounded-2xl p-8 shadow-lg shadow-navy/8">
          <h1 className="text-2xl font-bold text-text-dark mb-2 tracking-tight">Войти</h1>
          <p className="text-sm text-muted mb-6">С возвращением</p>

          <GoogleButton label="Войти через Google" />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ice" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-muted">или</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dark mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-ice bg-white text-text-dark placeholder:text-muted/60 focus:outline-none focus:border-sapphire transition-colors"
                placeholder="you@school.kz"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-dark mb-2">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-ice bg-white text-text-dark placeholder:text-muted/60 focus:outline-none focus:border-sapphire transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sapphire hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
              Войти
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="text-sapphire font-semibold hover:underline">
            Создать
          </Link>
        </p>
      </div>
    </main>
  )
}
