import { FadeIn } from '@/components/ui/FadeIn'

const problems = [
  {
    icon: '💸',
    title: 'Потери на возвратах',
    description: 'Ученик уходит на 3-й неделе — нет договора, нет оснований удержать оплату. Школа теряет деньги.',
  },
  {
    icon: '⚖️',
    title: 'Споры без доказательств',
    description: 'Конфликт об условиях обучения — устные договорённости не работают в суде.',
  },
  {
    icon: '🧾',
    title: 'Налоговые риски',
    description: 'Без договора поступления выглядят как неоформленный доход. Вопросы от налоговой.',
  },
  {
    icon: '📋',
    title: 'Бумажная волокита',
    description: 'Распечатать, подписать, отсканировать, хранить. Каждый новый ученик — 20 минут административной работы.',
  },
]

export function ProblemSection() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Проблема</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Школы теряют деньги без договоров
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            1000+ языковых школ в Казахстане работают на доверии. Это работает до первого конфликта.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.1}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-6 py-4">
            <span className="text-2xl">📉</span>
            <p className="text-red-700 text-sm font-medium">
              По нашим оценкам, средняя школа теряет{' '}
              <span className="font-extrabold">150 000–300 000 ₸ в год</span>{' '}
              из-за отсутствия договоров
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
