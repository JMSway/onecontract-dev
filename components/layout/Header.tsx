'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-navy/95 backdrop-blur-md border-b border-powder/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-white tracking-tight">
            OneContract
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#how-it-works" className="text-muted hover:text-white transition-colors">
              Как работает
            </a>
            <a href="#pricing" className="text-muted hover:text-white transition-colors">
              Тарифы
            </a>
            <Link href="/auth/login" className="text-muted hover:text-white transition-colors">
              Войти
            </Link>
            <Link
              href="/auth/register"
              className="bg-sapphire hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold text-sm"
            >
              Попробовать бесплатно
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-muted hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Меню"
          >
            {mobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden bg-navy/98 backdrop-blur-md border-b border-powder/10 px-4 py-5 flex flex-col gap-4"
          >
            <a
              href="#how-it-works"
              className="text-muted hover:text-white transition-colors py-1 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Как работает
            </a>
            <a
              href="#pricing"
              className="text-muted hover:text-white transition-colors py-1 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Тарифы
            </a>
            <div className="pt-3 mt-2 border-t border-powder/10">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center bg-sapphire hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Войти
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
