import Link from 'next/link'
import { FadeIn } from '@/components/ui/FadeIn'

export function CtaSection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Начните работать с{' '}
            <span className="text-indigo-300">договорами сегодня</span>
          </h2>
          <p className="mt-6 text-indigo-200 text-lg max-w-xl mx-auto">
            Настройка занимает 15 минут. Первые 5 договоров — бесплатно.
            Никакой бумаги, никакого NCALayer.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/50 text-base"
          >
            Попробовать бесплатно →
          </Link>
          <a
            href="mailto:hello@onecontract.kz"
            className="border border-indigo-400/50 text-indigo-100 font-semibold px-8 py-4 rounded-xl hover:bg-indigo-800/50 transition-all text-base"
          >
            Связаться с нами
          </a>
        </FadeIn>

        <FadeIn delay={0.3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-indigo-300 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Без привязки карты
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Отмена в любой момент
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Данные хранятся в РК
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
