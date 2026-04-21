'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileSignature, Loader2, MailCheck } from 'lucide-react'
import { signUpWithEmail } from '@/lib/supabase-auth'
import { GoogleButton } from '@/components/auth/GoogleButton'

interface FieldErrors {
  email?: string
  password?: string
}

function mapSupabaseError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
    return 'Аккаунт с таким email уже существует. Попробуйте войти.'
  }
  if (m.includes('password') && m.includes('6')) {
    return 'Пароль должен быть не короче 6 символов'
  }
  if (m.includes('invalid email')) {
    return 'Неверный формат email'
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Слишком много попыток. Подождите минуту.'
  }
  return 'Не удалось создать аккаунт. Попробуйте ещё раз.'
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const errors: FieldErrors = {}
    if (!email.trim()) errors.email = 'Введите email'
    if (!password) {
      errors.password = 'Введите пароль'
    } else if (password.length < 6) {
      errors.password = 'Пароль должен быть не короче 6 символов'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      await signUpWithEmail(email.trim(), password)
      setSubmittedEmail(email.trim())
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setFormError(mapSupabaseError(msg))
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
        {submittedEmail ? (
          <div className="bg-white border border-ice rounded-2xl p-8 shadow-lg shadow-navy/8 text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-sapphire/10 flex items-center justify-center">
              <MailCheck size={28} strokeWidth={1.5} className="text-sapphire" />
            </div>
            <h1 className="text-2xl font-bold text-text-dark mb-3 tracking-tight">
              Проверьте почту
            </h1>
            <p className="text-sm text-muted leading-relaxed mb-6">
              Мы отправили письмо для подтверждения на{' '}
              <span className="text-text-dark font-semibold">{submittedEmail}</span>.
              Перейдите по ссылке, чтобы активировать аккаунт.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full bg-sapphire hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-ice rounded-2xl p-8 shadow-lg shadow-navy/8">
            <h1 className="text-2xl font-bold text-text-dark mb-2 tracking-tight">Создать аккаунт</h1>
            <p className="text-sm text-muted mb-6">Начните работу с электронными договорами</p>

            <GoogleButton label="Продолжить через Google" />

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ice" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-muted">или</span>
              </div>
            </div>

            {formError && (
              <p className="mb-4 text-sm text-danger bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {formError}
              </p>
            )}

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-dark mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined })
                  }}
                  className={`w-full px-4 py-3 text-sm rounded-xl border bg-white text-text-dark placeholder:text-muted/60 focus:outline-none transition-colors ${
                    fieldErrors.email
                      ? 'border-danger/50 focus:border-danger'
                      : 'border-ice focus:border-sapphire'
                  }`}
                  placeholder="you@school.kz"
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-danger mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-dark mb-2">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password)
                      setFieldErrors({ ...fieldErrors, password: undefined })
                  }}
                  className={`w-full px-4 py-3 text-sm rounded-xl border bg-white text-text-dark placeholder:text-muted/60 focus:outline-none transition-colors ${
                    fieldErrors.password
                      ? 'border-danger/50 focus:border-danger'
                      : 'border-ice focus:border-sapphire'
                  }`}
                  placeholder="Минимум 6 символов"
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <p className="text-sm text-danger mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sapphire hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
                Создать аккаунт
              </button>
            </form>
          </div>
        )}

        {!submittedEmail && (
          <p className="mt-6 text-center text-sm text-muted">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="text-sapphire font-semibold hover:underline">
              Войти
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
