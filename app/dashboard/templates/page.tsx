import { LayoutTemplate } from 'lucide-react'
import { EmptyState } from '@/components/dashboard/EmptyState'

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark tracking-tight mb-1">Шаблоны</h1>
        <p className="text-sm text-muted">Договоры, из которых будут создаваться документы</p>
      </div>

      <div className="bg-white border border-ice rounded-2xl shadow-sm overflow-hidden">
        <EmptyState
          icon={LayoutTemplate}
          title="Скоро: загрузка шаблонов"
          description="Загрузите свой Word или PDF — Claude AI автоматически извлечёт переменные поля (ФИО, ИИН, суммы, даты). Потом ваши менеджеры будут заполнять готовую форму."
        />
      </div>
    </div>
  )
}
