import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-bold text-xl text-white">
              OneContract
            </Link>
            <p className="mt-3 text-sm leading-relaxed">
              Электронные договоры для образовательных центров Казахстана.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              ПЭП. Статья 152 ГК РК.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Продукт</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Как работает</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Тарифы</a></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Регистрация</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Вход</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Компания</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:hello@onecontract.kz" className="hover:text-white transition-colors">Контакты</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Условия использования</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Поддержка</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:hello@onecontract.kz" className="hover:text-white transition-colors">
                  hello@onecontract.kz
                </a>
              </li>
              <li className="text-xs text-gray-500">Пн–Пт, 9:00–18:00 (UTC+5)</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} OneContract. Все права защищены.</p>
          <p>Almaty, Kazakhstan 🇰🇿</p>
        </div>
      </div>
    </footer>
  )
}
