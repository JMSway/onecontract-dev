'use client'

import { useEffect, useState } from 'react'
import { FileText, CheckCircle2, Clock, Wallet, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { ContractRow } from '@/components/dashboard/ContractRow'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { useDashboardUser } from '@/components/dashboard/DashboardUserContext'
import { getContracts, getDashboardStats, getTemplates } from '@/lib/db'
import { formatTenge, greetingByHour } from '@/lib/dashboard/mocks'
import type { Contract as DashboardContract } from '@/lib/dashboard/types'
import type { Contract, DashboardStats, Template } from '@/lib/types'

function toDashboardContract(c: Contract): DashboardContract {
  const amountRaw = c.data?.amount
  const amount =
    typeof amountRaw === 'number' ? amountRaw : Number(amountRaw ?? 0)
  return {
    id: c.id,
    number: c.id.slice(0, 8).toUpperCase(),
    studentName: c.recipient_name ?? c.data?.student_name ?? '—',
    courseName: c.data?.course_name ?? '—',
    amount: Number.isFinite(amount) ? amount : 0,
    status: c.status,
    channel: c.sent_via ?? 'email',
    sentAt: c.sent_at ?? null,
    createdAt: c.created_at,
  }
}

export default function DashboardOverviewPage() {
  const user = useDashboardUser()
  const greeting = greetingByHour(new Date().getHours())

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user.orgId) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const [s, c, t] = await Promise.all([
          getDashboardStats(user.orgId),
          getContracts(user.orgId),
          getTemplates(user.orgId),
        ])
        if (cancelled) return
        setStats(s)
        setContracts(c)
        setTemplates(t)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user.orgId])

  const onboardingSteps = [
    { id: 'account', title: 'Создан аккаунт', done: true },
    { id: 'template', title: 'Загрузить первый шаблон', done: templates.length > 0 },
    { id: 'contract', title: 'Создать первый договор', done: contracts.length > 0 },
    {
      id: 'signature',
      title: 'Получить первую подпись',
      done: contracts.some((c) => c.status === 'signed'),
    },
    { id: 'team', title: 'Пригласить менеджера', done: false },
  ]

  const pending = stats?.pending ?? 0
  const total = stats?.total ?? 0
  const subtitle =
    loading
      ? 'Загружаем данные...'
      : total === 0
        ? 'Начните с загрузки первого шаблона договора'
        : pending > 0
          ? `У вас ${pending} ${pending === 1 ? 'договор ждёт' : 'договоров ждут'} подписания`
          : 'Все договоры в актуальном статусе'

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-dark tracking-tight mb-1">
          {greeting}, {user.name}!
        </h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Ошибка загрузки</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Всего договоров"
          value={loading ? '—' : String(stats?.total ?? 0)}
          delta={0}
          deltaLabel="за месяц"
          delay={0.05}
        />
        <StatCard
          icon={CheckCircle2}
          label="Подписано"
          value={loading ? '—' : String(stats?.signed ?? 0)}
          delta={0}
          deltaLabel="за месяц"
          delay={0.13}
        />
        <StatCard
          icon={Clock}
          label="Ожидают"
          value={loading ? '—' : String(stats?.pending ?? 0)}
          delta={0}
          deltaLabel="за месяц"
          delay={0.21}
        />
        <StatCard
          icon={Wallet}
          label="Выручка"
          value={loading ? '—' : formatTenge(stats?.revenue ?? 0)}
          delta={0}
          deltaLabel="%"
          delay={0.29}
        />
      </div>

      <QuickActions />

      <OnboardingChecklist steps={onboardingSteps} />

      <div
        className="bg-white border border-ice rounded-2xl shadow-sm overflow-hidden animate-fade-in-up"
        style={{ animationDelay: '0.4s' }}
      >
        <div className="px-5 py-4 border-b border-ice flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-dark tracking-tight">
            Последние договоры
          </h2>
        </div>
        {loading ? (
          <div className="divide-y divide-ice">
            {[0, 1, 2].map((i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="h-4 bg-ice rounded w-1/3" />
                <div className="h-4 bg-ice rounded w-1/4 ml-auto" />
              </div>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="У вас пока нет договоров"
            description="Создайте первый за 30 секунд — выберите шаблон, заполните данные клиента и отправьте на подпись."
            cta={{ label: 'Создать договор', href: '/dashboard/contracts/new' }}
          />
        ) : (
          <div>
            {contracts.slice(0, 5).map((c) => (
              <ContractRow key={c.id} contract={toDashboardContract(c)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
