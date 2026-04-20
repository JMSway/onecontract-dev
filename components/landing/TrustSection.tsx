import { FadeIn } from '@/components/ui/FadeIn'
import { ShieldCheck, Scale, Lock, FileCheck, Fingerprint } from 'lucide-react'

const legalPoints = [
  {
    Icon: Scale,
    title: 'Закон РК №370-II',
    description: 'Об электронном документе и электронной цифровой подписи. ПЭП признана законной формой подписи.',
  },
  {
    Icon: FileCheck,
    title: 'Статья 152 ГК РК',
    description: 'Электронная форма договора приравнена к письменной. Суды принимают такие договоры как доказательство.',
  },
  {
    Icon: ShieldCheck,
    title: 'ПЭП с июля 2024',
    description: 'Простая электронная подпись через SMS OTP или eGov QR полностью легализована в Казахстане.',
  },
  {
    Icon: Lock,
    title: 'SHA-256 хэширование',
    description: 'После подписания договор получает криптографический отпечаток. Ни одна буква не может быть изменена.',
  },
  {
    Icon: Fingerprint,
    title: 'eGov QR = ЭЦП',
    description: 'Подпись через QR-код eGov юридически эквивалентна электронной цифровой подписи (ЭЦП/ЭЦК).',
  },
]

export function TrustSection() {
  return (
    <section className="py-20 md:py-28 bg-navy relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(#A6C5D7 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-powder/20 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-powder">Юридическая основа</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">
            Юридическая сила как у бумажного договора
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed max-w-xl mx-auto">
            OneContract работает строго в рамках законодательства Республики Казахстан.
          </p>
        </FadeIn>

        {/* Central shield */}
        <FadeIn delay={0.1} className="flex justify-center mb-12">
          <div className="relative">
            <div className="w-24 h-24 bg-sapphire/20 border border-sapphire/30 rounded-3xl flex items-center justify-center">
              <ShieldCheck size={48} strokeWidth={1.5} className="text-powder" />
            </div>
            <div className="absolute inset-0 bg-sapphire/10 rounded-3xl blur-xl" />
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {legalPoints.map(({ Icon, title, description }, i) => (
            <FadeIn key={title} delay={i * 0.1}>
              <div className="border border-powder/10 rounded-2xl p-5 hover:border-powder/25 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-sapphire/15 rounded-xl flex items-center justify-center group-hover:bg-sapphire/25 transition-colors">
                    <Icon size={20} strokeWidth={1.5} className="text-powder" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm mb-1">{title}</p>
                    <p className="text-muted text-sm leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}

          {/* Fifth item spans full width on mobile, fills last slot on desktop */}
          <FadeIn delay={0.5} className="sm:col-span-2 lg:col-span-1">
            <div className="border border-success/20 bg-success/5 rounded-2xl p-5 h-full flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-success/15 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} strokeWidth={1.5} className="text-success" />
              </div>
              <div>
                <p className="font-semibold text-success text-sm mb-1">Аудит-лог каждого действия</p>
                <p className="text-muted text-sm leading-relaxed">
                  IP, устройство, время — всё записывается. При любом споре у вас есть доказательства.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.6} className="mt-10">
          <div className="border-t border-powder/10 pt-8 text-center">
            <p className="text-sm text-muted">
              Не используем NCALayer, KalkanCrypt или другие legacy-решения.
              Только современные, доступные с любого смартфона методы подписи.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
