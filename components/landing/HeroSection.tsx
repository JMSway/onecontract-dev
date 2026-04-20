'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, FileSignature, MessageSquare, QrCode } from 'lucide-react'

function PhoneMockup() {
  return (
    <div className="relative w-[220px] sm:w-[260px] mx-auto">
      {/* Phone shell */}
      <div className="relative bg-[#0a0f1e] border border-powder/20 rounded-[2.5rem] p-3 shadow-2xl shadow-navy/80">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#050810] rounded-full z-10" />

        {/* Screen */}
        <div className="bg-[#f8fafc] rounded-[2rem] overflow-hidden pt-8 pb-4 px-4 min-h-[440px] flex flex-col">
          {/* Status bar */}
          <div className="flex justify-between text-[10px] text-gray-400 mb-4 px-1">
            <span>9:41</span>
            <span>●●●</span>
          </div>

          {/* App header */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-sapphire rounded-lg flex items-center justify-center">
              <FileSignature size={16} strokeWidth={1.5} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-dark">OneContract</p>
              <p className="text-[9px] text-muted">Договор №OCT-2024-089</p>
            </div>
          </div>

          {/* Contract preview */}
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-4 shadow-sm flex-1">
            <p className="text-[10px] font-semibold text-text-dark mb-2">Договор об оказании услуг</p>
            <div className="space-y-1.5">
              {['Алматы English School', 'Ученик: Айгерим Сейткали', 'Курс: General English B1', 'Оплата: 45 000 ₸/мес', 'Срок: 6 месяцев'].map((line) => (
                <div key={line} className="h-2.5 flex items-center">
                  <span className="text-[9px] text-gray-500">{line}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-dashed border-gray-200 pt-2">
              <p className="text-[8px] text-muted">Условия возврата: возврат 50% при отказе...</p>
            </div>
          </div>

          {/* OTP input */}
          <div className="mb-3">
            <p className="text-[10px] text-muted mb-2 text-center">Введите код из SMS</p>
            <div className="flex gap-1.5 justify-center">
              {['4', '7', '2', '1', '0', '3'].map((d, i) => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${
                  i < 5 ? 'bg-sapphire/10 border-sapphire/30 text-sapphire' : 'border-gray-200 text-gray-300'
                }`}>
                  {i < 5 ? d : '_'}
                </div>
              ))}
            </div>
          </div>

          {/* Sign button */}
          <button className="w-full bg-sapphire text-white text-[11px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
            <Check size={14} strokeWidth={2.5} />
            Подписать договор
          </button>

          {/* Bottom indicator */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <p className="text-[9px] text-muted">Защищено SHA-256</p>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute -right-8 top-16 bg-white border border-ice rounded-xl px-3 py-2 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} strokeWidth={1.5} className="text-sapphire" />
          <span className="text-[10px] font-semibold text-text-dark">SMS отправлена</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute -left-10 bottom-24 bg-success/10 border border-success/30 rounded-xl px-3 py-2 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <Check size={14} strokeWidth={2} className="text-success" />
          <span className="text-[10px] font-semibold text-success">Подписан</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute -right-6 bottom-16 bg-white border border-ice rounded-xl px-3 py-2 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <QrCode size={14} strokeWidth={1.5} className="text-sapphire" />
          <span className="text-[10px] font-semibold text-text-dark">eGov QR</span>
        </div>
      </motion.div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-navy overflow-hidden px-4">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#A6C5D7 1px, transparent 1px), linear-gradient(90deg, #A6C5D7 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-sapphire/10 rounded-full blur-[120px] pointer-events-none" />

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
              {[
                'Бесплатный тариф',
                'Без привязки карты',
                'Настройка 15 минут',
              ].map((item) => (
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center md:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
