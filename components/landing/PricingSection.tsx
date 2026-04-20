import Link from 'next/link'
import { FadeIn } from '@/components/ui/FadeIn'

const plans = [
  {
    name: 'Стартовый',
    price: '0',
    period: 'навсегда',
    description: 'Для тех, кто только начинает',
    color: 'border-gray-200',
    badge: null,
    features: [
      '5 договоров в месяц',
      '1 шаблон',
      'SMS OTP подписание',
      'Хранение 3 месяца',
      'Email поддержка',
    ],
    cta: 'Начать бесплатно',
    ctaStyle: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50',
    href: '/auth/register',
  },
  {
    name: 'Школа',
    price: '9 900',
    period: 'в месяц',
    description: 'Для активно работающих школ',
    color: 'border-indigo-600 ring-2 ring-indigo-600',
    badge: 'Популярный',
    features: [
      'До 100 договоров в месяц',
      'До 10 шаблонов',
      'SMS OTP + eGov QR',
      'Хранение 3 года',
      'AI-извлечение полей',
      'Роли: владелец + менеджеры',
      'Приоритетная поддержка',
    ],
    cta: 'Попробовать 14 дней бесплатно',
    ctaStyle: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200',
    href: '/auth/register?plan=school',
  },
  {
    name: 'Сеть',
    price: '24 900',
    period: 'в месяц',
    description: 'Для сети учебных центров',
    color: 'border-gray-200',
    badge: null,
    features: [
      'Неограниченные договоры',
      'Неограниченные шаблоны',
      'SMS OTP + eGov QR',
      'Хранение 10 лет',
      'AI-извлечение полей',
      'Несколько филиалов',
      'API-интеграция',
      'Персональный менеджер',
    ],
    cta: 'Связаться с нами',
    ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    href: 'mailto:sales@onecontract.kz',
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Тарифы</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Прозрачные цены
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Начните бесплатно. Платите только когда вырастете.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <div className={`relative bg-white rounded-2xl border-2 p-6 sm:p-8 flex flex-col h-full ${plan.color}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    {plan.price !== '0' && <span className="text-gray-400 text-sm mb-1">₸</span>}
                    <span className="text-gray-400 text-sm mb-1 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full text-center font-semibold py-3 px-6 rounded-xl transition-all text-sm ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.35} className="mt-10 text-center text-gray-400 text-sm">
          Все тарифы включают SSL, аудит-лог и Supabase RLS-изоляцию данных.
          <br />
          Цены указаны без НДС.
        </FadeIn>
      </div>
    </section>
  )
}
