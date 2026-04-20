import Link from 'next/link'
import { FadeIn } from '@/components/ui/FadeIn'

export function CtaSection() {
  return (
    <section className="py-20 md:py-28 bg-navy px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sapphire/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-powder/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            Начните работать с{' '}
            <span className="text-powder">договорами сегодня</span>
          </h2>
          <p className="mt-6 text-base text-muted leading-relaxed max-w-xl mx-auto">
            Настройка занимает 15 минут. Первые 5 договоров — бесплатно.
            Никакой бумаги, никакого NCALayer.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-sapphire hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-xl shadow-sapphire/30"
          >
            Попробовать бесплатно →
          </Link>
          <a
            href="mailto:hello@onecontract.kz"
            className="border border-powder text-white font-semibold px-6 py-3 rounded-xl hover:bg-sapphire/10 transition-colors"
          >
            Связаться с нами
          </a>
        </FadeIn>

        <FadeIn delay={0.3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-muted text-sm">
          {[
            'Без привязки карты',
            'Отмена в любой момент',
            'Данные хранятся в РК',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}
