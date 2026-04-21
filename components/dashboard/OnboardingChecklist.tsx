import { Check, Circle } from 'lucide-react'
import type { OnboardingStep } from '@/lib/dashboard/types'

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter((s) => s.done).length
  const progress = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="bg-white border border-ice rounded-2xl p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-text-dark tracking-tight mb-1">
            Начните работу с OneContract
          </h3>
          <p className="text-sm text-muted">
            {doneCount} из {steps.length} шагов выполнено
          </p>
        </div>
        <span className="text-sm font-semibold text-sapphire tabular-nums">{progress}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-ice mb-5 overflow-hidden">
        <div
          className="h-full bg-sapphire rounded-full transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-3">
        {steps.map((s) => (
          <li key={s.id} className="flex items-center gap-3">
            {s.done ? (
              <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                <Check size={12} strokeWidth={3} className="text-white" />
              </div>
            ) : (
              <Circle size={20} strokeWidth={1.5} className="text-muted/50 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                s.done ? 'text-muted line-through' : 'text-text-dark font-medium'
              }`}
            >
              {s.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
