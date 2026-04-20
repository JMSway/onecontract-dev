import Link from 'next/link'
import { FadeIn } from '@/components/ui/FadeIn'
import { Gift, ArrowRight } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="py-20 md:py-28 bg-navy relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(#A6C5D7 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-powder/20 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sapphire/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 bg-warning/10 border border-warning/20 text-warning text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
            <Gift size={14} strokeWidth={1.5} />
            Ограниченное предложение
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
            Первые 10 школ получают{' '}
            <span className="text-powder">3 месяца бесплатно</span>
          </h2>

          <p className="text-base text-muted leading-relaxed max-w-xl mx-auto mb-10">
            Оставьте заявку — мы свяжемся в течение дня, настроим шаблон
            под ваш договор и запустим вместе.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 bg-sapphire hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-xl shadow-sapphire/20 text-base"
          >
            Оставить заявку
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <a
            href="mailto:hello@onecontract.kz"
            className="inline-flex items-center justify-center gap-2 border border-powder/20 text-powder hover:border-powder/40 font-medium px-8 py-4 rounded-xl transition-colors text-base"
          >
            hello@onecontract.kz
          </a>
        </FadeIn>

        <FadeIn delay={0.3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted">
          {['Без привязки карты', 'Отмена в любой момент', 'Данные хранятся в РК'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-powder/40 rounded-full" />
              {item}
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}
