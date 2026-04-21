import Link from 'next/link'
import { PlusCircle, Upload, UserPlus, ArrowRight } from 'lucide-react'

const actions = [
  {
    href: '/dashboard/contracts/new',
    icon: PlusCircle,
    title: 'Создать договор',
    description: 'Заполните форму из шаблона',
    primary: true,
  },
  {
    href: '/dashboard/templates',
    icon: Upload,
    title: 'Загрузить шаблон',
    description: 'Word или PDF — AI извлечёт поля',
    primary: false,
  },
  {
    href: '/dashboard/team',
    icon: UserPlus,
    title: 'Пригласить менеджера',
    description: 'Разделите работу с командой',
    primary: false,
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((a, i) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            className={`block h-full rounded-2xl p-5 transition-all hover:scale-[1.02] animate-fade-in-up ${
              a.primary
                ? 'bg-sapphire text-white shadow-lg shadow-sapphire/20 hover:bg-blue-700'
                : 'bg-white border border-ice text-text-dark shadow-sm hover:border-sapphire/30'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  a.primary ? 'bg-white/15' : 'bg-ice'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className={a.primary ? 'text-white' : 'text-sapphire'}
                />
              </div>
              <ArrowRight
                size={18}
                strokeWidth={1.5}
                className={a.primary ? 'text-white/70' : 'text-muted'}
              />
            </div>
            <p className="font-semibold text-base mb-1 tracking-tight">{a.title}</p>
            <p className={`text-sm ${a.primary ? 'text-white/75' : 'text-muted'}`}>
              {a.description}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
