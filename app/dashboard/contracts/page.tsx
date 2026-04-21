'use client'

import Link from 'next/link'
import { FileText, Search, PlusCircle, Filter } from 'lucide-react'
import { ContractRow } from '@/components/dashboard/ContractRow'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { mockContracts } from '@/lib/dashboard/mocks'

export default function ContractsListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark tracking-tight mb-1">Договоры</h1>
          <p className="text-sm text-muted">{mockContracts.length} договоров</p>
        </div>
        <Link
          href="/dashboard/contracts/new"
          className="hidden sm:inline-flex items-center gap-2 bg-sapphire hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <PlusCircle size={16} strokeWidth={1.5} />
          Создать
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Поиск по имени ученика…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-ice bg-white text-text-dark placeholder:text-muted/60 focus:outline-none focus:border-sapphire transition-colors"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-white border border-ice hover:border-sapphire/40 text-text-dark font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Filter size={16} strokeWidth={1.5} />
          Фильтры
        </button>
      </div>

      <div className="bg-white border border-ice rounded-2xl shadow-sm overflow-hidden">
        {mockContracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Пока нет договоров"
            description="Создайте первый договор — выберите шаблон, заполните данные клиента и отправьте на подпись."
            cta={{ label: 'Создать договор', href: '/dashboard/contracts/new' }}
          />
        ) : (
          <div>
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-ice text-[11px] font-semibold uppercase tracking-widest text-muted">
              <span>Ученик</span>
              <span>Курс</span>
              <span>Сумма</span>
              <span>Канал</span>
              <span>Статус</span>
              <span>Дата</span>
            </div>
            {mockContracts.map((c) => (
              <ContractRow key={c.id} contract={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
