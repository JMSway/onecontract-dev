'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-navy overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-sapphire/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-powder/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-2 bg-sapphire/20 border border-powder/30 text-powder text-xs sm:text-sm font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            ПЭП легализован в РК — июль 2024
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-6"
        >
          Договор с учеником{' '}
          <span className="text-powder">за 30 секунд.</span>
          <br />
          Без NCALayer.{' '}
          <span className="text-ice">Без бумаги.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-base text-muted leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Электронные договоры для языковых школ Казахстана.
          Загрузите свой шаблон — AI автоматически разберёт поля.
          Ученик подписывает по SMS или eGov QR.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
            <Link
              href="/auth/register"
              className="block bg-sapphire hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-sapphire/30"
            >
              Попробовать бесплатно
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
            <a
              href="#how-it-works"
              className="block border border-powder text-white font-semibold px-6 py-3 rounded-xl hover:bg-sapphire/10 transition-colors"
            >
              Как это работает →
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-muted text-sm"
        >
          {[
            'Бесплатный тариф навсегда',
            'Юридически значимо по ГК РК',
            'Настройка за 15 минут',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
      >
        <svg className="w-6 h-6 text-powder/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  )
}
