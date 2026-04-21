import { FadeIn } from '@/components/ui/FadeIn'
import { RefreshCcw, MessageCircleWarning, ClipboardX } from 'lucide-react'

const pains = [
  {
    Icon: RefreshCcw,
    title: 'Ученик бросил курс — вернули всё',
    quote: '«Договора нет — пришлось вернуть 100% оплаты. Три месяца работы впустую.»',
    loss: '− 135 000 ₸',
    lossLabel: 'средняя потеря за случай',
    detail: 'Без письменных условий возврата школа не может законно удержать деньги. Суд встанет на сторону ученика.',
  },
  {
    Icon: MessageCircleWarning,
    title: 'Родитель написал жалобу',
    quote: '«Нам нечем доказать, что занятия проводились и услуга была оказана в полном объёме.»',
    loss: '− Репутация',
    lossLabel: 'и риск штрафа от ЗПП',
    detail: 'Устные договорённости не работают. Без подписанного договора любая жалоба — это ваши потери.',
  },
  {
    Icon: ClipboardX,
    title: 'Налоговая проверка',
    quote: '«500 учеников за год — ни одного документа. Проверяющий провёл у нас три дня.»',
    loss: '− Штрафы',
    lossLabel: 'и доначисления налогов',
    detail: 'Каждая оплата без договора — это неподтверждённый доход. Налоговая может переквалифицировать всё.',
  },
]

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28 bg-ice">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-sapphire">Проблема</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-text-dark tracking-tight">
            Без договора школа теряет деньги
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed max-w-xl mx-auto">
            Это происходит в каждой второй школе. И каждый раз — неожиданно.
          </p>
        </FadeIn>

        <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-6 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {pains.map(({ Icon, title, quote, loss, lossLabel, detail }, i) => (
            <FadeIn key={title} delay={i * 0.12} className="min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-center flex-shrink-0 md:flex-shrink h-auto flex flex-col">
              <div className="bg-white border border-ice rounded-2xl p-6 shadow-sm flex flex-col h-full group transition-all duration-300 hover:border-powder/60 hover:-translate-y-1 hover:shadow-md">
                {/* Icon */}
                <div className="w-12 h-12 bg-danger/8 rounded-xl flex items-center justify-center mb-5">
                  <Icon size={24} strokeWidth={1.5} className="text-danger" />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-text-dark text-base mb-3">{title}</h3>

                {/* Quote */}
                <p className="text-muted text-sm leading-relaxed italic mb-4 flex-1">
                  {quote}
                </p>

                {/* Loss badge */}
                <div className="border-t border-ice pt-4 mt-auto">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-danger">{loss}</span>
                    <span className="text-xs text-muted">{lossLabel}</span>
                  </div>
                  <p className="text-xs text-muted/70 mt-1 leading-snug">{detail}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} className="mt-10">
          <div className="bg-white border border-danger/20 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 bg-danger/8 rounded-xl flex items-center justify-center">
              <ClipboardX size={20} strokeWidth={1.5} className="text-danger" />
            </div>
            <p className="text-sm text-text-dark leading-relaxed">
              <span className="font-semibold">По оценкам рынка:</span>{' '}
              средняя языковая школа в Казахстане теряет{' '}
              <span className="font-bold text-danger">150 000–300 000 ₸ в год</span>{' '}
              из-за отсутствия письменных договоров с учениками.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
