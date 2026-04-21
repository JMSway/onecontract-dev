'use client'

import { useEffect, useState } from 'react'
import { FileText, CheckCircle2, Clock, Wallet, AlertCircle, Loader2, Building2 } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { ContractRow } from '@/components/dashboard/ContractRow'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { useDashboardUser } from '@/components/dashboard/DashboardUserContext'
import { getContracts, getDashboardStats, getTemplates } from '@/lib/db'
import { createClient } from '@/lib/supabase'
import { formatTenge, greetingByHour } from '@/lib/dashboard/mocks'
import type { Contract as DashboardContract } from '@/lib/dashboard/types'
import type { Contract, DashboardStats, Template } from '@/lib/types'

function toDashboardContract(c: Contract): DashboardContract {
  const amountRaw = c.data?.amount
  const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw ?? 0)
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

function OrgSetupForm({ onDone }: { onDone: (orgId: string, orgName: string) => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: rpcErr } = await supabase
      .rpc('create_organization', { org_name: trimmed })
      .single<{ id: string; name: string }>()

    if (rpcErr || !data) {
      setError('Не удалось создать организацию. Попробуйте ещё раз.')
      setLoading(false)
      return
    }

    onDone(data.id, data.name)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white border border-ice rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 bg-sapphire/10 rounded-xl flex items-center justify-center mb-5">
            <Building2 size={24} strokeWidth={1.5} className="text-sapphire" />
          </div>
          <h2 className="text-xl font-bold text-text-dark mb-1 tracking-tight">
            Как называется ваша школа?
          </h2>
          <p className="text-sm text-muted mb-6">
            Это имя будет отображаться в договорах и доступно вашей команде.
          </p>

          {error && (
            <p className="mb-4 text-sm text-danger bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dark mb-2">
                Название организации
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Almaty English School"
                className="w-full px-4 py-3 text-sm rounded-xl border border-ice bg-white text-text-dark placeholder:text-muted/60 focus:outline-none focus:border-sapphire transition-colors"
                autoFocus
                maxLength={120}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-sapphire hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
              Продолжить
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-ice rounded-2xl p-5 animate-pulse">
          <div className="h-4 bg-ice rounded w-1/2 mb-3" />
          <div className="h-7 bg-ice rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

function ContractsSkeleton() {
  return (
    <div className="divide-y divide-ice">
      {[0, 1, 2].map((i) => (
        <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-ice rounded w-1/3" />
          <div className="h-4 bg-ice rounded w-1/4 ml-auto" />
        </div>
      ))}
    </div>
  )
}

export default function DashboardOverviewPage() {
  const user = useDashboardUser()
  const greeting = greetingByHour(new Date().getHours())

  const [orgId, setOrgId] = useState<string>(user.orgId)
  const [orgName, setOrgName] = useState<string>(user.orgName)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [s, c, t] = await Promise.all([
          getDashboardStats(orgId),
          getContracts(orgId),
          getTemplates(orgId),
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
    return () => { cancelled = true }
  }, [orgId])

  if (!orgId) {
    return (
      <OrgSetupForm
        onDone={(id, name) => {
          setOrgId(id)
          setOrgName(name)
        }}
      />
    )
  }

  const onboardingSteps = [
    { id: 'account', title: 'Создан аккаунт', done: true },
    { id: 'template', title: 'Загрузить первый шаблон', done: templates.length > 0 },
    { id: 'contract', title: 'Создать первый договор', done: contracts.length > 0 },
    { id: 'signature', title: 'Получить первую подпись', done: contracts.some((c) => c.status === 'signed') },
    { id: 'team', title: 'Пригласить менеджера', done: false },
  ]

  const pending = stats?.pending ?? 0
  const total = stats?.total ?? 0
  const subtitle = loading
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

      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Всего договоров" value={String(stats?.total ?? 0)} delta={0} deltaLabel="за месяц" delay={0.05} />
          <StatCard icon={CheckCircle2} label="Подписано" value={String(stats?.signed ?? 0)} delta={0} deltaLabel="за месяц" delay={0.13} />
          <StatCard icon={Clock} label="Ожидают" value={String(stats?.pending ?? 0)} delta={0} deltaLabel="за месяц" delay={0.21} />
          <StatCard icon={Wallet} label="Выручка" value={formatTenge(stats?.revenue ?? 0)} delta={0} deltaLabel="%" delay={0.29} />
        </div>
      )}

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
          {orgName && (
            <span className="text-xs text-muted">{orgName}</span>
          )}
        </div>
        {loading ? (
          <ContractsSkeleton />
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
