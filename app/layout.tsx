import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
})

export const metadata: Metadata = {
  title: 'OneContract — Электронные договоры для школ Казахстана',
  description:
    'Подписывайте договоры с учениками за 30 секунд. SMS OTP или eGov QR. Без NCALayer. Юридически значимо по ГК РК.',
  keywords: ['электронный договор', 'языковая школа', 'Казахстан', 'ЭЦП', 'ПЭП', 'eGov QR'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-text-dark">{children}</body>
    </html>
  )
}
