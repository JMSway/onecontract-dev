import { FadeIn } from '@/components/ui/FadeIn'

const testimonials = [
  {
    quote: 'Раньше тратили по 20 минут на каждый договор — распечатать, подписать, отсканировать. Теперь ученик подписывает по SMS прямо на вводном занятии.',
    name: 'Айгерим С.',
    role: 'Директор языковой школы, Алматы',
    avatar: 'А',
    color: 'bg-ice text-sapphire',
  },
  {
    quote: 'Три месяца назад ученица потребовала вернуть деньги за «неоказанные услуги». Договор в OneContract решил вопрос за 5 минут — показала ей подписанный документ.',
    name: 'Дина М.',
    role: 'Владелец IT-школы, Астана',
    avatar: 'Д',
    color: 'bg-ice text-sapphire',
  },
  {
    quote: 'Настроила шаблон за 15 минут, загрузила свой старый Word-файл — система сама нашла все поля. Менеджеры освоили за день.',
    name: 'Салтанат К.',
    role: 'Руководитель центра, Шымкент',
    avatar: 'С',
    color: 'bg-ice text-sapphire',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-ice px-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-powder">Отзывы</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-text-dark tracking-tight">
            Школы уже работают без бумаги
          </h2>
          <p className="mt-3 text-muted text-sm">* Отзывы участников пилотного тестирования</p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.12}>
              <div className="bg-white border border-ice rounded-2xl p-6 shadow-sm flex flex-col h-full">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted text-sm leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-text-dark text-sm">{t.name}</p>
                    <p className="text-muted text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 sm:gap-12 bg-white rounded-2xl px-8 py-6 shadow-sm border border-ice">
            {[
              { value: '1 000+', label: 'языковых школ в РК' },
              { value: '30 сек', label: 'на подписание договора' },
              { value: '100%', label: 'юридическая значимость' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-sapphire">{stat.value}</p>
                <p className="text-muted text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
