import Link from 'next/link'
import { FadeIn } from '@/components/ui/FadeIn'
import { Check, Zap, Building2 } from 'lucide-react'

const plans = [
  {
    id: 'start',
    Icon: Zap,
    name: 'Старт',
    price: '0',
    period: '',
    priceLabel: 'Бесплатно',
    description: 'Попробуйте без риска',
    highlighted: false,
    badge: null,
    features: [
      'До 10 договоров в месяц',
      '1 пользователь',
      '1 шаблон договора',
      'SMS OTP подписание',
      'Хранение договоров 3 мес.',
      'Email поддержка',
    ],
    cta: 'Начать бесплатно',
    ctaHref: '/auth/register',
  },
  {
    id: 'school',
    Icon: Building2,
    name: 'Школа',
    price: '15 000',
    period: '₸/мес',
    priceLabel: null,
    description: 'Для работающей школы',
    highlighted: true,
    badge: 'Популярный',
    features: [
      'Безлимит договоров',
      'До 5 менеджеров',
      'Неограниченные шаблоны',
      'SMS OTP + eGov QR',
      'AI-извлечение полей',
      'Хранение 5 лет',
      'Уведомления по SMS/Email',
      'Приоритетная поддержка',
    ],
    cta: 'Подключить',
    ctaHref: '/auth/register?plan=school',
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-sapphire">Тарифы</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-text-dark tracking-tight">
            Прозрачные цены
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed max-w-md mx-auto">
            Начните бесплатно. Переходите на платный план когда будете готовы.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <FadeIn key={plan.id} delay={i * 0.12}>
              <div className={`relative rounded-2xl p-6 sm:p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                plan.highlighted
                  ? 'bg-navy border-2 border-sapphire/40 ring-4 ring-sapphire/10 shadow-[0_20px_60px_-15px_rgba(15,82,186,0.5)]'
                  : 'bg-white border-2 border-ice hover:border-powder/50 hover:shadow-powder/20'
              }`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-sapphire text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 mb-3 ${plan.highlighted ? 'text-powder' : 'text-sapphire'}`}>
                    <plan.Icon size={20} strokeWidth={1.5} />
                    <span className={`text-sm font-semibold uppercase tracking-wide ${plan.highlighted ? 'text-powder' : 'text-sapphire'}`}>
                      {plan.name}
                    </span>
                  </div>

                  {plan.priceLabel ? (
                    <div className="flex items-end gap-2">
                      <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-text-dark'}`}>
                        {plan.priceLabel}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-text-dark'}`}>
                        {plan.price}
                      </span>
                      <span className={`text-sm mb-1.5 ${plan.highlighted ? 'text-muted' : 'text-muted'}`}>
                        {plan.period}
                      </span>
                    </div>
                  )}

                  <p className={`text-sm mt-1 ${plan.highlighted ? 'text-muted' : 'text-muted'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        size={16}
                        strokeWidth={2.5}
                        className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-powder' : 'text-success'}`}
                      />
                      <span className={`text-sm ${plan.highlighted ? 'text-muted' : 'text-muted'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className={`block w-full text-center font-semibold py-3.5 px-6 rounded-xl transition-colors text-sm ${
                    plan.highlighted
                      ? 'bg-sapphire hover:bg-blue-700 text-white shadow-lg shadow-sapphire/30'
                      : 'border border-powder text-text-dark hover:bg-ice'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3} className="mt-8 text-center text-sm text-muted">
          Все тарифы включают SSL-шифрование, аудит-лог и изоляцию данных.
          <br className="hidden sm:block" />
          Нужно больше? <a href="mailto:hello@onecontract.kz" className="text-sapphire hover:underline">Напишите нам</a> — настроим под вашу школу.
        </FadeIn>
      </div>
    </section>
  )
}
