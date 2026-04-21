'use client'

import { FileText, CheckCircle2, Clock, Wallet } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { ContractRow } from '@/components/dashboard/ContractRow'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { useDashboardUser } from '@/components/dashboard/DashboardUserContext'
import {
  mockStats,
  mockContracts,
  mockOnboarding,
  formatTenge,
  greetingByHour,
} from '@/lib/dashboard/mocks'

export default function DashboardOverviewPage() {
  const user = useDashboardUser()
  const greeting = greetingByHour(new Date().getHours())
  const pending = mockStats.pending
  const subtitle =
    mockContracts.length === 0
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Всего договоров"
          value={String(mockStats.total)}
          delta={mockStats.deltaTotal}
          deltaLabel="за месяц"
          delay={0.05}
        />
        <StatCard
          icon={CheckCircle2}
          label="Подписано"
          value={String(mockStats.signed)}
          delta={mockStats.deltaSigned}
          deltaLabel="за месяц"
          delay={0.13}
        />
        <StatCard
          icon={Clock}
          label="Ожидают"
          value={String(mockStats.pending)}
          delta={mockStats.deltaPending}
          deltaLabel="за месяц"
          delay={0.21}
        />
        <StatCard
          icon={Wallet}
          label="Выручка"
          value={formatTenge(mockStats.revenue)}
          delta={mockStats.deltaRevenue}
          deltaLabel="%"
          delay={0.29}
        />
      </div>

      <QuickActions />

      <OnboardingChecklist steps={mockOnboarding} />

      <div
        className="bg-white border border-ice rounded-2xl shadow-sm overflow-hidden animate-fade-in-up"
        style={{ animationDelay: '0.4s' }}
      >
        <div className="px-5 py-4 border-b border-ice flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-dark tracking-tight">
            Последние договоры
          </h2>
        </div>
        {mockContracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="У вас пока нет договоров"
            description="Создайте первый за 30 секунд — выберите шаблон, заполните данные клиента и отправьте на подпись."
            cta={{ label: 'Создать договор', href: '/dashboard/contracts/new' }}
          />
        ) : (
          <div>
            {mockContracts.slice(0, 5).map((c) => (
              <ContractRow key={c.id} contract={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
