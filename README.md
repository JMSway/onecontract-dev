# OneContract

> Электронные договоры для образовательных центров Казахстана — быстро, легально и без лишних действий.

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare_Pages-orange?logo=cloudflare)](https://pages.cloudflare.com)

---

## Проблема

Языковые школы и образовательные центры в Казахстане работают **без договоров с учениками** — теряют деньги на возвратах, не могут доказать условия в спорах, несут налоговые риски. Существующие EDO-платформы (TrustMe, Documentolog) ориентированы на корпоративный документооборот, а не на создание договоров там, где их никогда не было.

**OneContract создаёт договоры там, где их не было** — специализированное решение для учебных заведений.

---

## Решение

- Загружаете свой Word/PDF-договор → AI извлекает поля автоматически
- Менеджер заполняет форму → система генерирует чистый PDF
- Клиент получает ссылку по SMS/Email → подписывает через ОТП или eGov QR
- Всё. Юридически значимый договор готов за 30 секунд

---

## Технологии

| Слой | Технология |
|------|-----------|
| Framework | Next.js 16+ (App Router, TypeScript) |
| Стили | Tailwind CSS |
| Анимации | Framer Motion |
| База данных | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Деплой | Cloudflare Pages |
| PDF | pdf-lib (генерация), react-pdf (просмотр) |
| SMS | Mobizon.kz / sms.kz |
| Электронная подпись | SIGEX API (eGov QR, бесплатный уровень — 40 докум./мес.) |
| AI | Claude API (извлечение полей из шаблонов) |
| Email | Resend (бесплатно 100/день) |

---

## Структура проекта

```
/app
  /page.tsx                           — Лендинг (7 секций)
  /auth/login/page.tsx                — Вход
  /auth/register/page.tsx             — Регистрация организации
  /dashboard/page.tsx                 — Список договоров + статистика
  /dashboard/templates/page.tsx       — Управление шаблонами (только владелец)
  /dashboard/team/page.tsx            — Управление сотрудниками (только владелец)
  /dashboard/contracts/new/page.tsx   — Создание договора из шаблона
  /sign/[contractId]/page.tsx         — Публичная страница подписания (без авторизации)
  /api/auth/                          — Авторизация
  /api/contracts/                     — CRUD договоров
  /api/sign/                          — SMS OTP + SIGEX eGov QR
  /api/templates/                     — CRUD шаблонов + AI-извлечение
  /api/notify/                        — SMS + Email уведомления

/components
  /ui/          — Кнопки, инпуты, FadeIn-анимации (Tailwind + Framer Motion)
  /layout/      — Header, Footer
  /dashboard/   — Таблица договоров, карточки статистики
  /signing/     — Просмотрщик PDF, ввод OTP, QR-дисплей
  /landing/     — HeroSection, ProblemSection, SolutionSection,
                  TestimonialsSection, HowItWorksSection, PricingSection, CtaSection

/lib
  supabase.ts   — Инициализация Supabase клиента
  pdf.ts        — Генерация PDF из данных шаблона
  sms.ts        — Обёртка SMS-провайдера
  sigex.ts      — Обёртка SIGEX API (3 эндпоинта)
  ai.ts         — Claude API для извлечения полей шаблона
  hash.ts       — SHA-256 хэширование подписанных PDF
  types.ts      — Общие TypeScript-типы
```

---

## Лендинг (7 секций)

| # | Секция | Компонент |
|---|--------|-----------|
| 1 | Hero — заголовок + CTA | `HeroSection` |
| 2 | Проблема — боли школ | `ProblemSection` |
| 3 | Решение — 3 шага | `SolutionSection` |
| 4 | Отзывы | `TestimonialsSection` |
| 5 | Как работает + видео | `HowItWorksSection` |
| 6 | Тарифы | `PricingSection` |
| 7 | Финальный CTA + футер | `CtaSection` |

---

## База данных (Supabase PostgreSQL)

```sql
-- Организации (школы)
organizations (id uuid PK, name, bin, address, phone, email, created_at)

-- Пользователи с ролями
users (id uuid PK, org_id FK, email, role ENUM('owner','manager'), needs_approval bool, created_at)

-- Шаблоны договоров
templates (id uuid PK, org_id FK, name, description, fields jsonb, source_file_url, created_by FK, created_at)
-- fields: [{"key":"student_name","label":"ФИО ученика","type":"text"}, {"key":"iin","label":"ИИН","type":"iin"}]

-- Договоры
contracts (
  id uuid PK, org_id FK, template_id FK, data jsonb,
  pdf_url, pdf_hash,
  status ENUM('draft','pending_approval','sent','viewed','signed','declined'),
  sent_via ENUM('sms','email'),
  recipient_phone, recipient_email,
  created_by FK, approved_by FK,
  created_at, sent_at, viewed_at, signed_at
)

-- Подписи
signatures (
  id uuid PK, contract_id FK,
  method ENUM('sms_otp','egov_qr'),
  signer_ip, signer_ua, signer_iin,
  otp_code, otp_verified_at,
  egov_signature_data text, created_at
)

-- Журнал аудита
audit_log (id uuid PK, contract_id FK, action, actor, ip, ua, created_at)
```

---

## Роли и права

| Действие | Владелец | Менеджер |
|----------|----------|---------|
| Создавать шаблоны | ✅ | ❌ |
| Добавлять/удалять менеджеров | ✅ | ❌ |
| Заполнять договор из шаблона | ✅ | ✅ |
| Отправлять клиенту | ✅ всегда | ✅ или ⏳ ждёт одобрения |
| Одобрять отправку менеджера | ✅ | ❌ |
| Видеть все договоры организации | ✅ | только свои |
| Скачивать подписанные PDF | ✅ | только свои |

---

## Локальная разработка

```bash
# Клонировать репозиторий
git clone https://github.com/JMSway/onecontract.git
cd onecontract

# Установить зависимости
npm install

# Создать файл переменных окружения
cp .env.example .env.local
# Заполнить переменные (см. ниже)

# Запустить сервер разработки
npm run dev
```

### Переменные окружения (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Claude API
ANTHROPIC_API_KEY=your_claude_api_key

# SMS (Mobizon.kz)
MOBIZON_API_KEY=your_mobizon_key

# Email (Resend)
RESEND_API_KEY=your_resend_key

# SIGEX
SIGEX_API_URL=https://sigex.kz/api
```

---

## Бизнес-контекст

| Метрика | Данные |
|---------|--------|
| Рынок | 2.17M МСБ в Казахстане, 1000-1500 языковых школ |
| Конкуренты | TrustMe (3000+ клиентов), OnlineContract (141 клиент), Documentolog (enterprise) |
| Наше преимущество | Вертикальная специализация + ПЭП-first + AI-извлечение шаблонов |
| Правовая основа | ПЭП легализован июль 2024 в РК, Статья 152 ГК РК |
| Цель год 3 | 100-225 школ, 60-135M тенге выручки |

---

## Дорожная карта

### MVP (текущий фокус)
- [x] Спецификация и архитектура
- [x] Next.js проект + Tailwind + Framer Motion
- [x] Лендинг (7 секций)
- [ ] Supabase схема + RLS политики
- [ ] Авторизация (Supabase Auth)
- [ ] Создание и управление шаблонами (AI-powered)
- [ ] Создание и отправка договоров
- [ ] Публичная страница подписания (SMS OTP + eGov QR)
- [ ] Деплой на Cloudflare Pages

### Фаза 2
- [ ] WhatsApp Business API
- [ ] Визуальный редактор шаблонов (drag-and-drop)
- [ ] Массовая отправка (импорт Excel)
- [ ] IT-курсы и онлайн-школы

---

## Лицензия

Проприетарное программное обеспечение. Все права защищены.

---

*Сделано для образования в Казахстане 🇰🇿*
