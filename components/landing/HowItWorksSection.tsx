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
    <section id="how-it-works" className="py-20 sm:py-28 bg-white px-4">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Как работает</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            От пустого бланка до подписанного договора
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            Весь процесс занимает меньше минуты. Ученику нужен только телефон.
          </p>
        </FadeIn>

        {/* Video placeholder */}
        <FadeIn delay={0.1} className="mb-16">
          <div className="relative bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-3xl overflow-hidden aspect-video max-w-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-200">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-8 left-8 w-32 h-4 bg-white rounded-full" />
              <div className="absolute top-16 left-8 w-24 h-4 bg-white rounded-full" />
              <div className="absolute bottom-8 right-8 w-40 h-8 bg-white rounded-full" />
            </div>
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-white/40 hover:bg-white/30 transition-colors cursor-pointer">
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg">Демо-видео</p>
              <p className="text-indigo-300 text-sm mt-1">30 секунд — полный процесс подписания</p>
            </div>
          </div>
        </FadeIn>

        {/* Step flow */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {flow.map((item, i) => (
            <FadeIn key={item.step} delay={i * 0.08} direction="up">
              <div className="relative flex flex-col items-center text-center">
                {i < flow.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-indigo-100 z-0 -translate-y-px" />
                )}
                <div className="relative z-10 w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-3 border border-indigo-100">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm leading-snug">{item.label}</p>
                <p className="text-gray-400 text-xs mt-1 leading-snug">{item.detail}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
