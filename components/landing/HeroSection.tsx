'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, FileSignature, MessageSquare, QrCode, Signal, Wifi, BatteryFull } from 'lucide-react'

function PhoneMockup() {
  return (
    <div className="relative w-[280px] sm:w-[300px] mx-auto">
      {/* Outer frame — titanium edge */}
      <div className="relative bg-gradient-to-br from-[#1a1f2e] via-[#0d1220] to-[#1a1f2e] rounded-[3rem] p-[3px] shadow-[0_30px_80px_-15px_rgba(0,9,38,0.9)]">
        {/* Inner bezel */}
        <div className="relative bg-black rounded-[2.85rem] p-[8px]">
          {/* Screen */}
          <div className="relative bg-white rounded-[2.3rem] overflow-hidden aspect-[9/19.5] flex flex-col">

            {/* Dynamic Island */}
            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[95px] h-[30px] bg-black rounded-full z-30 flex items-center justify-between px-2.5">
              {/* Camera dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a2e]" />
              {/* Face ID sensor */}
              <div className="w-2 h-2 rounded-full bg-[#0a0a15] ring-[1px] ring-[#1a1a2e]" />
            </div>

            {/* Status bar */}
            <div className="pt-[14px] px-6 flex items-center justify-between text-[11px] font-semibold text-black z-20 relative">
              <span className="tabular-nums">9:41</span>
              <div className="w-[95px]" />
              <div className="flex items-center gap-1">
                <Signal size={12} strokeWidth={2.5} className="text-black" fill="black" />
                <Wifi size={12} strokeWidth={2.5} className="text-black" />
                <BatteryFull size={16} strokeWidth={2} className="text-black" />
              </div>
            </div>

            {/* App content */}
            <div className="flex-1 flex flex-col px-4 pt-6 pb-4 overflow-hidden">
              {/* App header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-sapphire rounded-[10px] flex items-center justify-center shadow-sm">
                  <FileSignature size={18} strokeWidth={1.8} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-text-dark leading-tight">OneContract</p>
                  <p className="text-[10px] text-muted leading-tight truncate">№OCT-2024-089</p>
                </div>
              </div>

              {/* Contract preview */}
              <div className="bg-ice/40 border border-ice rounded-xl p-3 mb-3">
                <p className="text-[11px] font-bold text-text-dark mb-2">Договор об оказании услуг</p>
                <div className="space-y-1">
                  {[
                    'Алматы English School',
                    'Ученик: Айгерим С.',
                    'Курс: General English B1',
                    'Оплата: 45 000 ₸/мес',
                    'Срок: 6 месяцев',
                  ].map((line) => (
                    <p key={line} className="text-[9.5px] text-muted leading-snug">{line}</p>
                  ))}
                </div>
              </div>

              {/* OTP input */}
              <div className="mb-3">
                <p className="text-[10px] text-muted mb-2 text-center">Введите код из SMS</p>
                <div className="flex gap-1 justify-center">
                  {['4', '7', '2', '1', '0', ''].map((d, i) => (
                    <div
                      key={i}
                      className={`w-9 h-10 rounded-lg flex items-center justify-center text-[13px] font-bold border ${
                        d
                          ? 'bg-sapphire/5 border-sapphire/40 text-sapphire'
                          : 'border-gray-200 text-gray-300 bg-gray-50'
                      }`}
                    >
                      {d || '_'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign button */}
              <button className="w-full bg-sapphire text-white text-[11px] font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                <Check size={14} strokeWidth={3} />
                Подписать договор
              </button>

              {/* Bottom indicator */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <p className="text-[9px] text-muted">Защищено SHA-256</p>
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-black/80 rounded-full" />
          </div>
        </div>
      </div>

      {/* Floating badges — positioned to NOT overlap the screen content */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute -right-4 sm:-right-10 top-[22%] bg-white border border-ice rounded-xl px-3 py-2 shadow-xl shadow-navy/30"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} strokeWidth={1.8} className="text-sapphire" />
          <span className="text-[10px] font-semibold text-text-dark whitespace-nowrap">SMS отправлена</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute -left-4 sm:-left-12 top-[46%] bg-white border border-success/30 rounded-xl px-3 py-2 shadow-xl shadow-navy/30"
      >
        <div className="flex items-center gap-2">
          <Check size={14} strokeWidth={2.5} className="text-success" />
          <span className="text-[10px] font-semibold text-success whitespace-nowrap">Подписан</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute -right-4 sm:-right-8 bottom-[14%] bg-white border border-ice rounded-xl px-3 py-2 shadow-xl shadow-navy/30"
      >
        <div className="flex items-center gap-2">
          <QrCode size={14} strokeWidth={1.8} className="text-sapphire" />
          <span className="text-[10px] font-semibold text-text-dark whitespace-nowrap">eGov QR</span>
        </div>
      </motion.div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-navy overflow-hidden px-4">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#A6C5D7 1px, transparent 1px), linear-gradient(90deg, #A6C5D7 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-[20%] w-[500px] h-[500px] bg-sapphire/20 rounded-full blur-[120px] pointer-events-none" 
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 md:py-0">
        <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-center min-h-screen md:min-h-0 md:py-32">

          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 border border-powder/20 text-powder text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                ПЭП легализован в РК с июля 2024
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight mb-6"
            >
              Ваши ученики подписывают договор{' '}
              <span className="text-powder">за 30 секунд</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base text-muted leading-relaxed mb-10 max-w-lg"
            >
              Электронные договоры для языковых школ.
              Без NCALayer. Без бумаги.{' '}
              <span className="text-powder/80">Юридическая сила по закону РК.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 bg-sapphire hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-sapphire/25"
                >
                  Попробовать бесплатно
                </Link>
              </motion.div>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 text-powder/70 hover:text-powder text-sm font-medium py-3.5 transition-colors"
              >
                Смотреть демо →
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10 pt-8 border-t border-powder/10 flex flex-wrap gap-x-8 gap-y-3"
            >
              {['Бесплатный тариф', 'Без привязки карты', 'Настройка 15 минут'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted">
                  <Check size={14} strokeWidth={2.5} className="text-success" />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: [0, -15, 0] }}
            transition={{ 
              opacity: { duration: 0.8, delay: 0.4 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
            }}
            className="flex justify-center md:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
