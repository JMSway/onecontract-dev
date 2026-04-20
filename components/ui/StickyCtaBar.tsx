'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function StickyCtaBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling past ~80vh (hero section)
      setVisible(window.scrollY > window.innerHeight * 0.8)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          <div className="bg-navy/95 backdrop-blur border-t border-powder/10 px-4 py-3 safe-area-pb">
            <Link
              href="/auth/register"
              className="flex items-center justify-center gap-2 w-full bg-sapphire hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Попробовать бесплатно
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
