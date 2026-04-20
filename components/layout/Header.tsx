'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-indigo-600 tracking-tight">
          OneContract
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">Как работает</a>
          <a href="#pricing" className="hover:text-indigo-600 transition-colors">Тарифы</a>
          <Link href="/auth/login" className="hover:text-indigo-600 transition-colors">Войти</Link>
          <Link
            href="/auth/register"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Попробовать бесплатно
          </Link>
        </nav>

        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Меню"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <a href="#how-it-works" className="text-gray-600" onClick={() => setMobileOpen(false)}>Как работает</a>
          <a href="#pricing" className="text-gray-600" onClick={() => setMobileOpen(false)}>Тарифы</a>
          <Link href="/auth/login" className="text-gray-600">Войти</Link>
          <Link
            href="/auth/register"
            className="bg-indigo-600 text-white px-4 py-3 rounded-lg text-center"
          >
            Попробовать бесплатно
          </Link>
        </div>
      )}
    </header>
  )
}
