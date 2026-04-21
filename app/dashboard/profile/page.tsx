'use client'

import { Mail, User as UserIcon, Building2 } from 'lucide-react'
import { useDashboardUser } from '@/components/dashboard/DashboardUserContext'

export default function ProfilePage() {
  const user = useDashboardUser()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark tracking-tight mb-1">Профиль</h1>
        <p className="text-sm text-muted">Ваши данные в системе</p>
      </div>

      <div className="bg-white border border-ice rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-ice">
          <div className="w-14 h-14 rounded-full bg-sapphire text-white text-xl font-semibold flex items-center justify-center">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-text-dark truncate">{user.name}</p>
            <p className="text-xs uppercase tracking-widest text-muted font-semibold mt-0.5">
              {user.role === 'owner' ? 'Владелец' : 'Менеджер'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Field icon={Mail} label="Email" value={user.email} />
          <Field icon={Building2} label="Организация" value={user.orgName} />
          <Field icon={UserIcon} label="ID" value={user.id} />
        </div>
      </div>

      <div className="bg-ice/40 border border-ice rounded-2xl p-5 text-sm text-muted leading-relaxed">
        Скоро: редактирование имени, смена пароля, подключение двухфакторной аутентификации.
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-ice flex items-center justify-center flex-shrink-0">
        <Icon size={16} strokeWidth={1.5} className="text-sapphire" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted mb-0.5">{label}</p>
        <p className="text-sm font-medium text-text-dark truncate">{value}</p>
      </div>
    </div>
  )
}
