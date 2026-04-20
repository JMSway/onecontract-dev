import { FadeIn } from '@/components/ui/FadeIn'

const steps = [
  {
    number: '01',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Загрузите шаблон',
    description: 'Загрузите свой Word или PDF договор. AI автоматически распознаёт все переменные поля: ФИО, ИИН, суммы, даты.',
    badge: 'AI-powered',
  },
  {
    number: '02',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: 'Заполните данные ученика',
    description: 'Менеджер вводит данные в простую форму. Система генерирует чистый PDF договор за секунду.',
    badge: null,
  },
  {
    number: '03',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    title: 'Ученик подписывает по SMS',
    description: 'Клиент получает ссылку по SMS. Открывает на телефоне, просматривает PDF, вводит код — договор подписан.',
    badge: 'SMS или eGov QR',
  },
]

export function SolutionSection() {
  return (
    <section className="py-20 sm:py-28 bg-white px-4">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Решение</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Три шага до подписанного договора
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            Никаких флешек, нотариусов и NCALayer. Работает с любого телефона.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200 z-0" />

          {steps.map((step, i) => (
            <FadeIn key={step.number} delay={i * 0.15} className="relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center border-2 border-white">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                {step.badge && (
                  <span className="mb-2 inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full">
                    {step.badge}
                  </span>
                )}
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.5} className="mt-14 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-6 sm:p-8 border border-indigo-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">Юридически значимо по законодательству РК</p>
              <p className="text-gray-500 text-sm mt-1">
                ПЭП (простая электронная подпись) легализована в Казахстане с июля 2024 г. Статья 152 ГК РК.
                Подпись через SMS OTP или eGov QR имеет полную юридическую силу.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
