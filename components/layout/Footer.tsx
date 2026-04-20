import Link from 'next/link'
import { Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#00061a] text-muted px-4 py-12 border-t border-powder/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-bold text-xl text-white tracking-tight">
              OneContract
            </Link>
            <p className="mt-3 text-sm leading-relaxed max-w-xs">
              Электронные договоры для образовательных центров Казахстана.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted/60">
              <div className="w-1.5 h-1.5 bg-success rounded-full" />
              ПЭП по ст. 152 ГК РК
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Продукт</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Как работает</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Тарифы</a></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Регистрация</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Вход</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Компания</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Условия использования</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Публичная оферта</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Контакты</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="mailto:hello@onecontract.kz" className="hover:text-white transition-colors flex items-center gap-2">
                  <Mail size={14} strokeWidth={1.5} />
                  hello@onecontract.kz
                </a>
              </li>
              <li className="text-xs text-muted/60 leading-relaxed">
                Пн–Пт, 9:00–18:00
                <br />UTC+5, Алматы
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-powder/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted/50">
          <p>© {new Date().getFullYear()} OneContract. Все права защищены.</p>
          <p>Республика Казахстан 🇰🇿</p>
        </div>
      </div>
    </footer>
  )
}
