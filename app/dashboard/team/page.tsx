import { Users } from 'lucide-react'
import { EmptyState } from '@/components/dashboard/EmptyState'

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark tracking-tight mb-1">Команда</h1>
        <p className="text-sm text-muted">Управление менеджерами вашей школы</p>
      </div>

      <div className="bg-white border border-ice rounded-2xl shadow-sm overflow-hidden">
        <EmptyState
          icon={Users}
          title="Скоро: работа с командой"
          description="Добавляйте менеджеров, выдавайте им права создавать договоры. Включите «требовать одобрения», если хотите проверять каждую отправку перед уходом клиенту."
        />
      </div>
    </div>
  )
}
