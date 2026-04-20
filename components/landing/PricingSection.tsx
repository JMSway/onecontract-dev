import Link from 'next/link'
import { FadeIn } from '@/components/ui/FadeIn'

const plans = [
  {
    name: 'Стартовый',
    price: '0',
    period: 'навсегда',
    description: 'Для тех, кто только начинает',
    highlighted: false,
    badge: null,
    features: [
      '5 договоров в месяц',
      '1 шаблон',
      'SMS OTP подписание',
      'Хранение 3 месяца',
      'Email поддержка',
    ],
    cta: 'Начать бесплатно',
    ctaStyle: 'border border-powder text-text-dark hover:bg-ice',
    href: '/auth/register',
  },
  {
    name: 'Школа',
    price: '9 900',
    period: 'в месяц',
    description: 'Для активно работающих школ',
    highlighted: true,
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
    ctaStyle: 'bg-sapphire hover:bg-blue-700 text-white shadow-lg shadow-sapphire/20',
    href: '/auth/register?plan=school',
  },
  {
    name: 'Сеть',
    price: '24 900',
    period: 'в месяц',
    description: 'Для сети учебных центров',
    highlighted: false,
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
    ctaStyle: 'border border-powder text-text-dark hover:bg-ice',
    href: 'mailto:sales@onecontract.kz',
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-ice px-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-powder">Тарифы</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-text-dark tracking-tight">
            Прозрачные цены
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed max-w-xl mx-auto">
            Начните бесплатно. Платите только когда вырастете.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <div className={`relative bg-white rounded-2xl border-2 p-6 sm:p-8 flex flex-col h-full ${
                plan.highlighted ? 'border-sapphire ring-2 ring-sapphire/20' : 'border-ice'
              }`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sapphire text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-semibold text-text-dark text-lg">{plan.name}</h3>
                  <p className="text-muted text-sm mt-1">{plan.description}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-bold text-text-dark">{plan.price}</span>
                    {plan.price !== '0' && <span className="text-muted text-sm mb-1">₸</span>}
                    <span className="text-muted text-sm mb-1 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-muted text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full text-center font-semibold py-3 px-6 rounded-xl transition-colors text-sm ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.35} className="mt-10 text-center text-muted text-sm">
          Все тарифы включают SSL, аудит-лог и Supabase RLS-изоляцию данных.
          <br />
          Цены указаны без НДС.
        </FadeIn>
      </div>
    </section>
  )
}
