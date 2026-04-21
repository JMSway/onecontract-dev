'use client'

import { useEffect, useState } from 'react'
import { Users, Loader2, Crown, Shield, ShieldOff } from 'lucide-react'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { useDashboardUser } from '@/components/dashboard/DashboardUserContext'

type Member = {
  id: string
  email: string
  role: 'owner' | 'manager'
  needs_approval: boolean
  created_at: string
}

export default function TeamPage() {
  const user = useDashboardUser()
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (user.role !== 'owner') return
    fetch('/api/team')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setMembers(d.members)
      })
      .catch(() => setError('Не удалось загрузить команду'))
  }, [user.role])

  async function toggleApproval(m: Member) {
    setSaving(m.id)
    const res = await fetch(`/api/team/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ needs_approval: !m.needs_approval }),
    })
    const data = await res.json()
    setSaving(null)
    if (!res.ok) {
      alert(data.error ?? 'Ошибка')
      return
    }
    setMembers((prev) =>
      prev?.map((x) => (x.id === m.id ? { ...x, needs_approval: !m.needs_approval } : x)) ?? null
    )
  }

  if (user.role !== 'owner') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark tracking-tight mb-1">Команда</h1>
          <p className="text-sm text-muted">Только владелец школы управляет командой</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark tracking-tight mb-1">Команда</h1>
        <p className="text-sm text-muted">
          Управление менеджерами и правами отправки договоров
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-ice rounded-2xl shadow-sm overflow-hidden">
        {!members ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-sapphire" strokeWidth={1.5} />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="В команде только вы"
            description="Пригласите менеджеров по email (скоро). Пока что поделитесь ссылкой на /auth/register — после регистрации они появятся здесь."
          />
        ) : (
          <ul className="divide-y divide-ice">
            {members.map((m) => (
              <li key={m.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-ice/60 flex items-center justify-center shrink-0">
                  {m.role === 'owner' ? (
                    <Crown size={18} className="text-sapphire" strokeWidth={1.5} />
                  ) : (
                    <Users size={18} className="text-muted" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-dark truncate">{m.email}</p>
                  <p className="text-xs text-muted">
                    {m.role === 'owner' ? 'Владелец' : 'Менеджер'}
                  </p>
                </div>
                {m.role === 'manager' ? (
                  <button
                    onClick={() => toggleApproval(m)}
                    disabled={saving === m.id}
                    title={
                      m.needs_approval
                        ? 'Отправка требует подтверждения владельца'
                        : 'Отправляет сразу, без подтверждения'
                    }
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      m.needs_approval
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                    } disabled:opacity-50`}
                  >
                    {saving === m.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : m.needs_approval ? (
                      <Shield size={12} strokeWidth={1.5} />
                    ) : (
                      <ShieldOff size={12} strokeWidth={1.5} />
                    )}
                    {m.needs_approval ? 'Требует одобрения' : 'Отправляет сразу'}
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-muted">—</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
