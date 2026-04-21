'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, LayoutTemplate, User, Send, FileCheck } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Шаблон', icon: LayoutTemplate },
  { id: 2, label: 'Данные клиента', icon: User },
  { id: 3, label: 'Способ отправки', icon: Send },
  { id: 4, label: 'Превью', icon: FileCheck },
]

export default function NewContractWizardPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text-dark transition-colors mb-3"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          К договорам
        </Link>
        <h1 className="text-2xl font-bold text-text-dark tracking-tight">Новый договор</h1>
      </div>

      <div className="bg-white border border-ice rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const active = step === s.id
            const done = step > s.id
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      done
                        ? 'bg-success text-white'
                        : active
                          ? 'bg-sapphire text-white'
                          : 'bg-ice text-muted'
                    }`}
                  >
                    {done ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <Icon size={14} strokeWidth={1.5} />
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-semibold ${
                      active ? 'text-text-dark' : 'text-muted'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block flex-1 h-px mx-2 ${
                      done ? 'bg-success' : 'bg-ice'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-ice rounded-2xl p-8 shadow-sm min-h-[360px] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-ice flex items-center justify-center mb-5">
            <LayoutTemplate size={26} strokeWidth={1.5} className="text-sapphire" />
          </div>
          <h2 className="text-lg font-semibold text-text-dark mb-2 tracking-tight">
            Шаг {step}: {STEPS[step - 1].label}
          </h2>
          <p className="text-sm text-muted max-w-md leading-relaxed">
            Подключение к Supabase и AI-извлечению полей из шаблонов появится на следующем этапе.
            Пока это заглушка мастера.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-ice pt-5 mt-5">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Назад
          </button>
          <button
            type="button"
            onClick={() => setStep(Math.min(STEPS.length, step + 1))}
            disabled={step === STEPS.length}
            className="inline-flex items-center gap-1.5 bg-sapphire hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {step === STEPS.length ? 'Отправить' : 'Далее'}
            <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
