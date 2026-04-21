import { Settings } from 'lucide-react'
import { EmptyState } from '@/components/dashboard/EmptyState'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark tracking-tight mb-1">Настройки</h1>
        <p className="text-sm text-muted">Данные организации, брендинг, уведомления</p>
      </div>

      <div className="bg-white border border-ice rounded-2xl shadow-sm overflow-hidden">
        <EmptyState
          icon={Settings}
          title="Скоро: настройки организации"
          description="Название школы, БИН, адрес, список курсов, логотип для PDF, уведомления и настройки оплаты. Всё это появится здесь."
        />
      </div>
    </div>
  )
}
