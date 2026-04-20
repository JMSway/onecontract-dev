import { FadeIn } from '@/components/ui/FadeIn'

const flow = [
  { step: '1', label: 'Менеджер заполняет форму', icon: '📝', detail: 'Выбирает шаблон → вводит данные ученика' },
  { step: '2', label: 'Система создаёт PDF', icon: '📄', detail: 'Чистый договор генерируется автоматически' },
  { step: '3', label: 'Клиент получает ссылку', icon: '📱', detail: 'SMS или Email с ссылкой на договор' },
  { step: '4', label: 'Просмотр и согласие', icon: '👁', detail: 'Открывает в браузере, соглашается на обработку ПД' },
  { step: '5', label: 'Подписание', icon: '✅', detail: 'SMS OTP-код или eGov QR-сканирование' },
  { step: '6', label: 'Готово', icon: '🔐', detail: 'PDF заблокирован, SHA-256 хэш, обе стороны получают копию' },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white px-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-powder">Как работает</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-text-dark tracking-tight">
            От пустого бланка до подписанного договора
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed max-w-2xl mx-auto">
            Весь процесс занимает меньше минуты. Ученику нужен только телефон.
          </p>
        </FadeIn>

        {/* Video placeholder */}
        <FadeIn delay={0.1} className="mb-16">
          <div className="relative bg-navy rounded-3xl overflow-hidden aspect-video max-w-3xl mx-auto flex items-center justify-center shadow-2xl shadow-navy/20">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-8 left-8 w-32 h-4 bg-white rounded-full" />
              <div className="absolute top-16 left-8 w-24 h-4 bg-white rounded-full" />
              <div className="absolute bottom-8 right-8 w-40 h-8 bg-white rounded-full" />
            </div>
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-sapphire/30 backdrop-blur rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-powder/40 hover:bg-sapphire/50 transition-colors cursor-pointer">
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg">Демо-видео</p>
              <p className="text-powder text-sm mt-1">30 секунд — полный процесс подписания</p>
            </div>
          </div>
        </FadeIn>

        {/* Step flow */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {flow.map((item, i) => (
            <FadeIn key={item.step} delay={i * 0.08} direction="up">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-16 h-16 bg-ice rounded-2xl flex items-center justify-center text-3xl mb-3 border border-powder/30">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-sapphire text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <p className="font-semibold text-text-dark text-xs sm:text-sm leading-snug">{item.label}</p>
                <p className="text-muted text-xs mt-1 leading-snug">{item.detail}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
