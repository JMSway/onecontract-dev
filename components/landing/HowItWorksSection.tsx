import { FadeIn } from '@/components/ui/FadeIn'
import { Play } from 'lucide-react'

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-sapphire">Демонстрация</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-text-dark tracking-tight">
            Как это выглядит в работе
          </h2>
        </FadeIn>

        {/* Video placeholder */}
        <FadeIn delay={0.1}>
          <div className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden aspect-video bg-gradient-to-br from-navy to-[#0a1628] shadow-2xl shadow-navy/20 group cursor-pointer">
            {/* Subtle grid */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(#A6C5D7 1px, transparent 1px), linear-gradient(90deg, #A6C5D7 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            {/* Fake screen elements for visual interest */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute top-8 left-8 right-8 flex items-center gap-3 opacity-20">
                <div className="h-2 bg-powder rounded-full" style={{ width: '40%' }} />
                <div className="h-2 bg-powder/50 rounded-full" style={{ width: '25%' }} />
              </div>
              <div className="absolute bottom-8 left-8 right-8 opacity-10">
                <div className="h-1.5 bg-powder rounded-full mb-2" style={{ width: '70%' }} />
                <div className="h-1.5 bg-powder rounded-full mb-2" style={{ width: '55%' }} />
                <div className="h-1.5 bg-powder rounded-full" style={{ width: '40%' }} />
              </div>

              {/* Play button */}
              <div className="relative flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-sapphire/25 border-2 border-powder/30 rounded-full flex items-center justify-center group-hover:bg-sapphire/40 transition-all duration-300 group-hover:scale-105">
                  <Play size={32} strokeWidth={1.5} className="text-white ml-1" fill="white" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">Полная демонстрация</p>
                  <p className="text-powder text-sm mt-1">60 секунд — от шаблона до подписанного договора</p>
                </div>
              </div>
            </div>

            {/* Duration badge */}
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-lg">
              1:00
            </div>
          </div>
        </FadeIn>

        {/* Below video: key timestamps / features */}
        <FadeIn delay={0.25} className="mt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { time: '0:00', label: 'Загрузка шаблона' },
              { time: '0:20', label: 'Заполнение данных' },
              { time: '0:40', label: 'Отправка по SMS' },
              { time: '0:55', label: 'Подпись клиента' },
            ].map((item) => (
              <div key={item.time} className="text-center p-3 rounded-xl bg-ice border border-powder/20">
                <p className="text-xs font-mono font-bold text-sapphire">{item.time}</p>
                <p className="text-xs text-muted mt-1 leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
