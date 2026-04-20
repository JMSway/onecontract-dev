import { FadeIn } from '@/components/ui/FadeIn'
import { Upload, Send, PenLine, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '01',
    Icon: Upload,
    title: 'Загрузите свой договор',
    description: 'Загрузите Word или PDF — AI сам найдёт все поля для заполнения: ФИО, ИИН, даты, суммы, название курса.',
    tag: 'AI-powered',
  },
  {
    number: '02',
    Icon: Send,
    title: 'Менеджер отправляет ученику',
    description: 'Заполните данные ученика в форме. Выберите канал — SMS или Email. Одна кнопка — и договор уже у клиента.',
    tag: 'SMS или Email',
  },
  {
    number: '03',
    Icon: PenLine,
    title: 'Ученик подписывает с телефона',
    description: 'Клиент открывает ссылку, читает договор и подписывает за 30 секунд — SMS-кодом или через eGov QR.',
    tag: '30 секунд',
  },
]

export function SolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-sapphire">Решение</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-text-dark tracking-tight">
            OneContract решает это за 3 шага
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed max-w-xl mx-auto">
            Никакого NCALayer. Никаких флешек. Работает с любого телефона.
          </p>
        </FadeIn>

        {/* Horizontal step flow */}
        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-10 left-[16.666%] right-[16.666%] h-px z-0">
            <div className="h-full bg-gradient-to-r from-ice via-powder/40 to-ice" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative z-10">
            {steps.map((step, i) => (
              <FadeIn key={step.number} delay={i * 0.15}>
                <div className="flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-sapphire rounded-2xl flex items-center justify-center shadow-lg shadow-sapphire/20">
                      <step.Icon size={32} strokeWidth={1.5} className="text-white" />
                    </div>
                    <span className="absolute -top-2 -left-2 w-6 h-6 bg-navy text-white text-[11px] font-bold rounded-full flex items-center justify-center border border-powder/20">
                      {step.number.replace('0', '')}
                    </span>
                  </div>

                  {/* Tag */}
                  <span className="inline-block bg-ice text-sapphire text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-powder/30">
                    {step.tag}
                  </span>

                  {/* Title */}
                  <h3 className="font-semibold text-text-dark text-lg mb-3 leading-snug">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted text-sm leading-relaxed">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Mobile arrows between steps */}
          <div className="md:hidden flex justify-center my-2">
            <ArrowRight size={20} strokeWidth={1.5} className="text-powder rotate-90" />
          </div>
        </div>

        {/* Result block */}
        <FadeIn delay={0.5} className="mt-14">
          <div className="bg-ice border border-powder/30 rounded-2xl p-6 sm:p-8">
            <div className="grid sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-powder/20">
              {[
                { value: '30 сек', label: 'время подписания', sub: 'с момента открытия ссылки' },
                { value: '0 ₸', label: 'нотариус', sub: 'не нужен по закону РК' },
                { value: '100%', label: 'юридическая сила', sub: 'ст. 152 ГК РК' },
              ].map((stat) => (
                <div key={stat.value} className="text-center pt-6 sm:pt-0 first:pt-0 sm:px-6">
                  <p className="text-3xl font-bold text-sapphire">{stat.value}</p>
                  <p className="text-sm font-semibold text-text-dark mt-1">{stat.label}</p>
                  <p className="text-xs text-muted mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
