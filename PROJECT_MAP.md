# PROJECT_MAP.md — OneContract
> Полная карта проекта. Читай перед каждой задачей.
> Последнее обновление: 21 апреля 2026

---

## СТАТУС ПРОЕКТА

### ✅ ГОТОВО
- [x] Лендинг (7 секций, брендбук, iPhone мокап)
- [x] Авторизация email + пароль
- [x] Авторизация Google OAuth (полностью настроен)
- [x] Auth callback route (без `export const runtime = 'edge'`)
- [x] Dashboard каркас (sidebar, mobile bottom-nav, header)
- [x] Реальные данные из Supabase (stats, contracts, templates)
- [x] Onboarding "Как называется ваша школа?" → создание org
- [x] Loading skeletons
- [x] Обработка ошибок (AlertCircle баннер)
- [x] Onboarding checklist (5 шагов, прогресс-бар)
- [x] Quick Actions (3 карточки)
- [x] Empty states для всех разделов
- [x] БД: 6 таблиц, RLS, триггер handle_new_user()
- [x] Деплой на Cloudflare Workers (auto-deploy на push в main)
- [x] Домен onecontract.kz подключён
- [x] CLAUDE.md + суб-файлы

### 🔴 НЕ ГОТОВО (в порядке приоритета)
1. Wizard создания договора
2. Страница просмотра договора
3. Загрузка шаблонов (Word/PDF → извлечение полей)
4. SMS OTP подписание
5. eGov QR подписание (SIGEX)
6. PDF генерация и хеширование
7. Email уведомления
8. Страница настроек организации
9. Управление командой (invite менеджера)
10. Audit log UI

---

## АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────┐
│                    КЛИЕНТ (Next.js)                  │
│                                                      │
│  /app/page.tsx ─────── Лендинг (public)              │
│  /app/auth/* ────────── Login, Register, Callback     │
│  /app/dashboard/* ───── Все внутренние страницы       │
│  /app/sign/[id] ─────── Страница подписания (public)  │
│  /app/api/* ─────────── API routes (серверная логика) │
└──────────────────────────┬──────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Supabase │ │ Mobizon  │ │  SIGEX   │
        │ (БД+Auth │ │ (SMS)    │ │ (eGov QR)│
        │ +Storage)│ │          │ │          │
        └──────────┘ └──────────┘ └──────────┘
              │
              ▼
        ┌──────────┐
        │  Resend  │
        │ (Email)  │
        └──────────┘
```

### Ключевые ограничения Cloudflare Workers
- **Размер bundle: максимум 3 МБ** → никакого framer-motion
- **Нет `export const runtime = 'edge'`** → @opennextjs/cloudflare сам управляет runtime
- **Node.js API ограничены** → используй `nodejs_compat` flag
- **Cold start ~100ms** → нормально для нашего кейса

### Стек (НЕ МЕНЯТЬ)
```
Frontend:     Next.js 16 + TypeScript + Tailwind CSS v4
Backend:      Next.js API routes (App Router)
Database:     Supabase (PostgreSQL + Auth + Storage + RLS)
Hosting:      Cloudflare Workers (@opennextjs/cloudflare v1.19+)
PDF:          pdf-lib (генерация) + react-pdf (просмотр)
SMS:          Mobizon.kz API
e-Sign:       SIGEX API (eGov QR)
AI:           Claude API (извлечение полей из шаблонов) — ПОТОМ
Email:        Resend (100/day бесплатно)
Icons:        lucide-react ТОЛЬКО, strokeWidth={1.5}
Анимации:     CSS keyframes ТОЛЬКО (не framer-motion)
```

---

## ЗАДАЧА 1: WIZARD СОЗДАНИЯ ДОГОВОРА
**Приоритет:** 🔴 КРИТИЧЕСКИЙ
**Файлы:** `app/dashboard/contracts/new/page.tsx`, `components/dashboard/contract-wizard/*`
**Оценка:** 4-6 часов

### Что делает
4-шаговый wizard: Шаблон → Данные клиента → Канал отправки → Превью

### Шаг 1: Выбор шаблона
```
UI: Сетка карточек с шаблонами организации
Данные: SELECT * FROM templates WHERE org_id = {orgId}
Если шаблонов 0 → кнопка "Загрузить первый шаблон" (ссылка на /dashboard/templates)
При выборе → сохранить template_id в state wizard'а
```

### Шаг 2: Данные клиента
```
UI: Форма с полями из template.fields (jsonb)
Обязательные поля ВСЕГДА:
  - recipient_name (string, "ФИО ученика")
  - recipient_phone (string, "+7...", для SMS)
  - recipient_email (string, опционально)

Дополнительные поля из template.fields:
  template.fields = [
    { key: "course_name", label: "Название курса", type: "text", required: true },
    { key: "price", label: "Стоимость", type: "number", required: true },
    { key: "duration", label: "Срок обучения", type: "text", required: false },
    ...
  ]

Валидация:
  - Телефон: /^\+7\d{10}$/ (казахстанский формат)
  - ФИО: минимум 3 символа
  - Email: стандартная валидация (если заполнен)
```

### Шаг 3: Канал отправки
```
UI: Radio buttons
  ○ SMS (на номер +7 XXX XXX XX XX)  ← по умолчанию
  ○ Email (на адрес xxx@xxx.xx)

Если у менеджера needs_approval = true:
  Показать предупреждение: "Договор будет отправлен после одобрения владельцем"
```

### Шаг 4: Превью и отправка
```
UI: Карточка-превью с данными:
  - Шаблон: {template.name}
  - Получатель: {recipient_name}
  - Телефон: {recipient_phone}
  - Курс: {course_name}
  - Стоимость: {price} ₸
  - Канал: SMS / Email
  
Кнопка: "Отправить на подпись" (primary, sapphire)
```

### Что происходит при нажатии "Отправить"
```
1. POST /api/contracts/create
   Body: { template_id, data: {...поля...}, recipient_name, recipient_phone, recipient_email, sent_via }

2. API route:
   a) Проверить auth (getServerUser)
   b) Проверить org_id
   c) Получить user.needs_approval
   
   d) Если needs_approval = false:
      - INSERT INTO contracts (..., status='sent', sent_at=now())
      - Отправить SMS/Email с ссылкой (ЗАДАЧА 4)
      - INSERT INTO audit_log (action='contract_sent')
   
   e) Если needs_approval = true:
      - INSERT INTO contracts (..., status='pending_approval')
      - Уведомить owner (ЗАДАЧА 7)
      - INSERT INTO audit_log (action='contract_pending_approval')

3. Redirect → /dashboard/contracts/{id}
```

### Навигация wizard'а
```
- Кнопки "Назад" / "Далее" внизу
- Индикатор шагов вверху: ① ── ② ── ③ ── ④
- Данные wizard'а хранить в React state (useState), НЕ в URL
- При уходе со страницы → confirm("Вы уверены? Данные будут потеряны")
```

### Компоненты для создания
```
components/dashboard/contract-wizard/
  WizardSteps.tsx        — индикатор шагов (1-4)
  TemplateSelect.tsx     — сетка выбора шаблона
  ClientDataForm.tsx     — динамическая форма из template.fields
  ChannelSelect.tsx      — выбор SMS/Email
  ContractPreview.tsx    — превью перед отправкой
```

---

## ЗАДАЧА 2: СТРАНИЦА ПРОСМОТРА ДОГОВОРА
**Приоритет:** 🔴 КРИТИЧЕСКИЙ
**Файл:** `app/dashboard/contracts/[id]/page.tsx`
**Оценка:** 2-3 часа

### UI
```
Верх: Заголовок + StatusBadge (draft/sent/viewed/signed/declined)
Секция 1: Данные договора (карточка)
  - Шаблон
  - Получатель
  - Телефон
  - Все поля из contract.data (jsonb)
  - Канал отправки
  - Дата создания / отправки / подписания

Секция 2: PDF превью (когда PDF будет готов — ЗАДАЧА 6)
  - react-pdf viewer
  - Кнопка "Скачать PDF"

Секция 3: Timeline / Audit log
  - Хронология событий из audit_log WHERE contract_id = {id}
  - Формат: 🟢 Создан → 📤 Отправлен → 👁 Просмотрен → ✅ Подписан

Секция 4: Действия
  - Если status='draft': "Отправить" 
  - Если status='sent': "Отправить повторно", "Отменить"
  - Если status='pending_approval': "Одобрить" (только owner), "Отклонить"
  - Если status='signed': "Скачать подписанный PDF"
```

### Данные
```sql
SELECT c.*, t.name as template_name 
FROM contracts c 
LEFT JOIN templates t ON c.template_id = t.id 
WHERE c.id = {id} AND c.org_id = {orgId}

SELECT * FROM audit_log WHERE contract_id = {id} ORDER BY created_at ASC

SELECT * FROM signatures WHERE contract_id = {id}
```

---

## ЗАДАЧА 3: ЗАГРУЗКА ШАБЛОНОВ
**Приоритет:** 🔴 КРИТИЧЕСКИЙ (без шаблона нельзя создать договор)
**Файл:** `app/dashboard/templates/page.tsx`, `app/api/templates/upload/route.ts`
**Оценка:** 3-4 часа

### MVP версия (без AI)
```
1. Owner нажимает "Загрузить шаблон"
2. Выбирает Word (.docx) или PDF файл
3. Файл загружается в Supabase Storage (bucket: 'templates')
4. Owner вручную задаёт поля шаблона:
   - Название шаблона
   - Описание (опционально)
   - Поля (добавлять динамически):
     [+ Добавить поле]
     Ключ: course_name | Название: Название курса | Тип: text | Обязательное: ✅
     Ключ: price | Название: Стоимость | Тип: number | Обязательное: ✅
     Ключ: duration | Название: Срок | Тип: text | Обязательное: ❌

5. Сохранить:
   INSERT INTO templates (org_id, name, description, fields, source_file_url, created_by)
   VALUES ({orgId}, {name}, {desc}, {fields_jsonb}, {storage_url}, {userId})
```

### Формат fields в jsonb
```json
[
  { "key": "course_name", "label": "Название курса", "type": "text", "required": true },
  { "key": "price", "label": "Стоимость (₸)", "type": "number", "required": true },
  { "key": "duration", "label": "Срок обучения", "type": "text", "required": false },
  { "key": "start_date", "label": "Дата начала", "type": "date", "required": false }
]
```

### Типы полей поддерживаемые
```
text     — строка
number   — число
date     — дата (YYYY-MM-DD)
select   — выпадающий список (+ options: ["6 мес", "12 мес"])
```

### UI страницы шаблонов
```
Если шаблонов 0 → EmptyState "Загрузите первый шаблон"
Если есть → таблица/карточки:
  | Название | Полей | Договоров | Создан | Действия |
  | Договор на курс | 4 | 12 | 21.04.26 | Ред. | Удал. |
```

### ПОТОМ (v2): AI извлечение полей
```
- Загрузка Word/PDF → отправка текста в Claude API
- Промпт: "Извлеки переменные поля из этого шаблона договора. Верни JSON массив полей."
- Claude возвращает fields[] → пользователь подтверждает/редактирует
- Это НЕ в MVP. Сначала ручной ввод полей.
```

---

## ЗАДАЧА 4: SMS OTP ПОДПИСАНИЕ
**Приоритет:** 🔴 КРИТИЧЕСКИЙ
**Файлы:** `app/sign/[contractId]/page.tsx`, `app/api/sign/*`
**Оценка:** 4-6 часов

### Flow подписания (клиентская сторона)
```
1. Клиент получает ссылку: https://onecontract.kz/sign/{contractId}
2. Открывает → видит:
   - Логотип OneContract
   - Название организации ("Almaty English School")
   - Тип договора ("Договор об оказании услуг")
   - Данные договора (ФИО, курс, стоимость, срок)
   
3. Галочка: ☐ "Я согласен на обработку персональных данных"
   (обязательная, без неё кнопка disabled)
   
4. Кнопка "Посмотреть договор" → показать PDF в react-pdf viewer
   (пока PDF не готов — показать текстовую версию данных)

5. Кнопка "Подписать через SMS"
   → POST /api/sign/{contractId}/send-otp
   → Mobizon отправляет 6-значный код на recipient_phone
   → UI: поле ввода 6 цифр + таймер 60 сек + "Отправить повторно"

6. Клиент вводит код
   → POST /api/sign/{contractId}/verify-otp
   → Проверка кода
   → Если верный: status='signed', signed_at=now()
   → Если неверный: "Неверный код, попробуйте ещё раз" (max 3 попытки)

7. Экран успеха:
   ✅ "Договор подписан!"
   "Копия отправлена на ваш номер/email"
   [Скачать PDF]
```

### API routes для SMS OTP

#### POST /api/sign/[contractId]/send-otp
```typescript
// app/api/sign/[contractId]/send-otp/route.ts

1. Получить contract из БД по contractId
2. Проверить: contract.status === 'sent' || contract.status === 'viewed'
   Если нет → 400 "Договор не доступен для подписания"
3. Сгенерировать OTP: 6 цифр (crypto.randomInt(100000, 999999))
4. Сохранить в signatures:
   INSERT INTO signatures (contract_id, method='sms_otp', otp_code={hash}, otp_expires_at={now+5min})
5. Отправить SMS через Mobizon:
   POST https://api.mobizon.kz/service/message/sendSmsMessage
   Headers: { 'X-Api-Key': MOBIZON_API_KEY }
   Body: { recipient: contract.recipient_phone, text: "Код подписания OneContract: {OTP}" }
6. Обновить contract.status = 'viewed' (если был 'sent')
7. INSERT INTO audit_log (action='otp_sent')
8. Return { success: true, phone_last4: "XXXX" }
```

#### POST /api/sign/[contractId]/verify-otp
```typescript
// app/api/sign/[contractId]/verify-otp/route.ts

1. Получить contract и последнюю signature
2. Проверить: signature.otp_expires_at > now()
   Если нет → 400 "Код истёк, запросите новый"
3. Проверить: attempts < 3
4. Сравнить hash(input_code) === signature.otp_code
5. Если совпал:
   a) UPDATE signatures SET otp_verified_at = now(), signer_ip, signer_ua
   b) UPDATE contracts SET status = 'signed', signed_at = now()
   c) INSERT INTO audit_log (action='contract_signed', metadata={method:'sms_otp'})
   d) TODO: Отправить PDF обеим сторонам (ЗАДАЧА 7)
   e) Return { success: true }
6. Если не совпал:
   a) Инкрементировать attempts
   b) Return { success: false, attempts_left: 3 - attempts }
```

### Mobizon API
```
Базовый URL: https://api.mobizon.kz/service/message/sendSmsMessage
Метод: POST
Headers: { 'Content-Type': 'application/json' }
Query params: apiKey={MOBIZON_API_KEY}&output=json
Body: {
  "recipient": "77001234567",  // без +
  "text": "OneContract: ваш код подписания 123456. Не сообщайте никому."
}

Env var в Cloudflare: MOBIZON_API_KEY
Стоимость: ~8-12 тенге/SMS
Лимиты: зависит от баланса
```

### Важно для /sign/[contractId]
```
- Это PUBLIC страница (без auth)
- Mobile-first design (90% клиентов откроют с телефона)
- Минимум элементов, максимум доверия
- Показать: "Защищено SHA-256", логотип OneContract
- Цвета: белый фон, navy заголовок, sapphire кнопки
- Никаких лишних ссылок — только подписание
```

---

## ЗАДАЧА 5: eGov QR ПОДПИСАНИЕ (SIGEX)
**Приоритет:** 🟡 ВАЖНЫЙ (после SMS)
**Файлы:** `app/api/sign/[contractId]/egov-qr/*`
**Оценка:** 3-4 часа

### Flow
```
1. На странице /sign/[contractId] — вторая кнопка: "Подписать через eGov"
2. POST /api/sign/{contractId}/egov-qr/create
   → Отправить PDF в SIGEX → получить QR code URL
3. Показать QR код клиенту
4. Клиент сканирует в eGov Mobile → подтверждает
5. Polling: GET /api/sign/{contractId}/egov-qr/status каждые 3 сек
6. Когда SIGEX подтвердит → signed
```

### SIGEX API (3 endpoint'а)
```
Пакет: sigex-qr-signing-client (npm)
Бесплатно: 40 документов/месяц

1. Создать запрос на подписание:
   POST https://sigex.kz/api/egovQr
   Body: { documentBase64: {pdf_base64}, title: "Договор №..." }
   Response: { id: "qr-id-xxx", qrCode: "data:image/png;base64,..." }

2. Проверить статус:
   GET https://sigex.kz/api/egovQr/{qrId}
   Response: { status: "pending" | "signed" | "declined", signatureData: {...} }

3. Когда signed:
   - Сохранить signatureData в signatures.egov_signature_data
   - UPDATE contracts SET status='signed'
   - Юридически = ЭЦП (полная юридическая сила)
```

### UI для QR
```
- QR код по центру (200x200px)
- Инструкция: "Откройте eGov Mobile → Сканируйте QR код → Подтвердите подпись"
- Таймер: QR действителен 5 минут
- Статус: "Ожидание подписи..." с анимацией (CSS spinner)
- При успехе: ✅ "Подписано через eGov!"
```

---

## ЗАДАЧА 6: PDF ГЕНЕРАЦИЯ
**Приоритет:** 🟡 ВАЖНЫЙ
**Файл:** `lib/pdf.ts`, `app/api/contracts/[id]/pdf/route.ts`
**Оценка:** 4-5 часов

### Когда генерируется PDF
```
Вариант A (простой, для MVP):
- При создании договора → сгенерировать PDF из шаблона + данные
- Сохранить в Supabase Storage (bucket: 'contracts')
- Сохранить URL в contracts.pdf_url

Вариант B (с загруженным шаблоном):
- Взять source_file_url из templates
- Заполнить плейсхолдеры данными из contract.data
- Сохранить результат
```

### MVP: генерация PDF с нуля (pdf-lib)
```typescript
// lib/pdf.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateContractPDF(contract, template, org) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  
  // Заголовок
  page.drawText(`ДОГОВОР ОБ ОКАЗАНИИ УСЛУГ`, { x: 50, y: 780, size: 16, font });
  
  // Данные организации
  page.drawText(`${org.name}`, { x: 50, y: 740, size: 12, font });
  
  // Данные клиента
  page.drawText(`Ученик: ${contract.recipient_name}`, { x: 50, y: 700, size: 12, font });
  
  // Поля из contract.data
  let y = 660;
  for (const [key, value] of Object.entries(contract.data)) {
    const field = template.fields.find(f => f.key === key);
    page.drawText(`${field?.label || key}: ${value}`, { x: 50, y, size: 11, font });
    y -= 25;
  }
  
  // Подпись (после подписания)
  // ...
  
  const bytes = await doc.save();
  return Buffer.from(bytes);
}
```

### SHA-256 хеширование
```typescript
// После подписания:
import { createHash } from 'crypto';

const hash = createHash('sha256').update(pdfBytes).digest('hex');
// UPDATE contracts SET pdf_hash = {hash} WHERE id = {contractId}
```

### Кириллица в PDF
```
pdf-lib НЕ поддерживает кириллицу из коробки.
Решение: встроить шрифт Inter (или другой с кириллицей) как custom font.

const fontBytes = fs.readFileSync('public/fonts/Inter-Regular.ttf');
const font = await doc.embedFont(fontBytes);

ВАЖНО: положить Inter-Regular.ttf в /public/fonts/
```

---

## ЗАДАЧА 7: EMAIL УВЕДОМЛЕНИЯ
**Приоритет:** 🟢 СРЕДНИЙ
**Файл:** `lib/email.ts`, `app/api/email/*`
**Оценка:** 2-3 часа

### Когда отправляем
```
1. Договор отправлен клиенту (если канал = email) → ссылка на подписание
2. Договор подписан → owner получает уведомление
3. Договор подписан → клиент получает копию PDF
4. needs_approval → owner получает запрос на одобрение
5. Договор отклонён → owner получает уведомление
```

### Resend API
```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSigningLink(to: string, contractUrl: string, orgName: string) {
  await resend.emails.send({
    from: 'OneContract <noreply@onecontract.kz>',
    to,
    subject: `${orgName} — подпишите договор`,
    html: `<p>Здравствуйте! Подпишите договор по ссылке:</p>
           <a href="${contractUrl}">Подписать договор</a>`
  });
}

// Env var: RESEND_API_KEY
// Лимит: 100 emails/day (бесплатный план)
// Домен: настроить DNS записи для onecontract.kz в Resend
```

---

## ЗАДАЧА 8: НАСТРОЙКИ ОРГАНИЗАЦИИ
**Приоритет:** 🟢 СРЕДНИЙ
**Файл:** `app/dashboard/settings/page.tsx`
**Оценка:** 2 часа

### Поля
```
- Название организации
- БИН/ИИН
- Адрес
- Телефон
- Email
- Логотип (загрузка в Supabase Storage)
```

---

## ЗАДАЧА 9: УПРАВЛЕНИЕ КОМАНДОЙ
**Приоритет:** 🟢 СРЕДНИЙ
**Файл:** `app/dashboard/team/page.tsx`, `app/api/team/*`
**Оценка:** 3-4 часа

### Flow
```
1. Owner нажимает "Пригласить менеджера"
2. Вводит email менеджера
3. Менеджер получает email со ссылкой-приглашением
4. Менеджер регистрируется → привязывается к org_id owner'а
5. Owner может включить/выключить needs_approval для менеджера
6. Owner может удалить менеджера из команды
```

---

## ЗАДАЧА 10: AUDIT LOG UI
**Приоритет:** 🟢 НИЗКИЙ
**Файл:** часть страницы просмотра договора

### Формат
```
Timeline вертикальная:
  🟢 21.04.2026 14:30 — Договор создан (Дамир А.)
  📤 21.04.2026 14:31 — Отправлен по SMS на +7 700 123 4567
  👁 21.04.2026 15:02 — Просмотрен (IP: 78.40.xxx.xxx)
  ✅ 21.04.2026 15:03 — Подписан через SMS OTP
```

---

## ПОРЯДОК РЕАЛИЗАЦИИ (ROADMAP)

```
НЕДЕЛЯ 1:
  День 1-2: ЗАДАЧА 3 (шаблоны) ← без шаблона ничего не работает
  День 3-4: ЗАДАЧА 1 (wizard создания договора)
  День 5:   ЗАДАЧА 2 (страница просмотра)

НЕДЕЛЯ 2:
  День 1-2: ЗАДАЧА 6 (PDF генерация)
  День 3-4: ЗАДАЧА 4 (SMS OTP)
  День 5:   ЗАДАЧА 5 (eGov QR)

НЕДЕЛЯ 3:
  День 1:   ЗАДАЧА 7 (email уведомления)
  День 2:   ЗАДАЧА 8 (настройки)
  День 3:   ЗАДАЧА 9 (команда)
  День 4-5: Тестирование, баг-фиксы, polish

ИТОГО: ~3 недели до рабочего MVP
```

---

## БАЗА ДАННЫХ (СПРАВОЧНИК)

```sql
-- Организации
organizations (
  id uuid PK DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bin text,                    -- БИН компании
  address text,
  phone text,
  email text,
  created_at timestamptz DEFAULT now()
)

-- Пользователи (привязаны к Supabase Auth)
users (
  id uuid PK REFERENCES auth.users(id),
  org_id uuid FK → organizations(id),
  email text NOT NULL,
  full_name text,
  role user_role DEFAULT 'owner',  -- ENUM: 'owner', 'manager'
  needs_approval boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- Шаблоны договоров
templates (
  id uuid PK DEFAULT gen_random_uuid(),
  org_id uuid FK → organizations(id),
  name text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]',  -- массив полей [{key, label, type, required}]
  source_file_url text,                -- URL файла в Storage
  created_by uuid FK → users(id),
  created_at timestamptz DEFAULT now()
)

-- Договоры
contracts (
  id uuid PK DEFAULT gen_random_uuid(),
  org_id uuid FK → organizations(id),
  template_id uuid FK → templates(id),
  data jsonb NOT NULL DEFAULT '{}',    -- заполненные поля {course_name: "English B1", price: 45000}
  pdf_url text,
  pdf_hash text,                       -- SHA-256 после подписания
  status contract_status DEFAULT 'draft',
    -- ENUM: 'draft','pending_approval','sent','viewed','signed','declined','expired'
  sent_via send_channel,               -- ENUM: 'sms','email'
  recipient_name text NOT NULL,
  recipient_phone text,
  recipient_email text,
  created_by uuid FK → users(id),
  approved_by uuid FK → users(id),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  expires_at timestamptz
)

-- Подписи
signatures (
  id uuid PK DEFAULT gen_random_uuid(),
  contract_id uuid FK → contracts(id),
  method sign_method,                  -- ENUM: 'sms_otp','egov_qr'
  signer_ip text,
  signer_ua text,
  signer_iin text,
  otp_code text,                       -- хеш OTP кода
  otp_expires_at timestamptz,
  otp_verified_at timestamptz,
  egov_signature_data jsonb,
  created_at timestamptz DEFAULT now()
)

-- Журнал действий
audit_log (
  id uuid PK DEFAULT gen_random_uuid(),
  contract_id uuid FK → contracts(id),
  action text NOT NULL,                -- 'contract_created','otp_sent','contract_signed',...
  actor text,                          -- user_id или 'client'
  ip text,
  ua text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
)
```

### RLS политики
```
Все таблицы: изоляция по org_id
users: видят только свою запись
templates: owner видит все org, manager видит все org
contracts: owner видит все org, manager видит только свои (created_by)
signatures: привязаны к contract → наследуют доступ
audit_log: привязаны к contract → наследуют доступ
```

---

## БРЕНДБУК (СПРАВОЧНИК)

```css
/* Цвета */
--navy:     #000926   /* hero, footer, тёмные секции */
--sapphire: #0F52BA   /* CTA кнопки, ссылки, акценты */
--powder:   #A6C5D7   /* бордеры, разделители */
--ice:      #D6E6F3   /* светлые фоны, карточки */
--white:    #FFFFFF   /* основной фон */
--text:     #0D1B2A   /* основной текст */
--muted:    #6B7E92   /* подзаголовки, описания */
--success:  #0F7B55   /* подписан */
--warning:  #B45309   /* ожидает */
--danger:   #B91C1C   /* отклонён, ошибки */

/* Шрифт: Inter (Google Fonts, latin + cyrillic) */
/* Иконки: lucide-react ТОЛЬКО, strokeWidth={1.5} */
/* Кнопки: rounded-xl, primary = bg-[#0F52BA] text-white */
/* Карточки: rounded-2xl border border-[#D6E6F3] shadow-sm */
/* Анимации: CSS keyframes ТОЛЬКО */
```

---

## ENV ПЕРЕМЕННЫЕ

### Cloudflare Workers (уже настроены)
```
NEXT_PUBLIC_SUPABASE_URL=https://zideehxygpnehkjeeqzr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NODE_VERSION=20
```

### Нужно добавить в Cloudflare Workers
```
MOBIZON_API_KEY=...         ← купить на mobizon.kz
RESEND_API_KEY=...          ← зарегистрироваться на resend.com
SIGEX_API_KEY=...           ← если требуется (проверить документацию)
```

### .env.local (для localhost)
```
NEXT_PUBLIC_SUPABASE_URL=https://zideehxygpnehkjeeqzr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
MOBIZON_API_KEY=...
RESEND_API_KEY=...
```

---

## ПРОМПТЫ ДЛЯ CLAUDE CODE

### Начало каждого промпта
```
Прочитай CLAUDE.md и PROJECT_MAP.md.
```

### ЗАДАЧА 3 — Шаблоны
```
Прочитай CLAUDE.md и PROJECT_MAP.md → ЗАДАЧА 3.
Реализуй загрузку шаблонов:
1. app/dashboard/templates/page.tsx — список шаблонов + кнопка "Загрузить"
2. Модалка/страница создания шаблона: название, описание, динамические поля (key, label, type, required)
3. API route POST /api/templates — сохранение в БД (без загрузки файла пока)
4. Список шаблонов из БД с EmptyState
5. Используй брендбук из CLAUDE.md
```

### ЗАДАЧА 1 — Wizard
```
Прочитай CLAUDE.md и PROJECT_MAP.md → ЗАДАЧА 1.
Реализуй 4-шаговый wizard создания договора:
1. components/dashboard/contract-wizard/ — 5 компонентов (WizardSteps, TemplateSelect, ClientDataForm, ChannelSelect, ContractPreview)
2. app/dashboard/contracts/new/page.tsx — основная страница wizard'а
3. API route POST /api/contracts/create
4. Динамическая форма из template.fields
5. Валидация телефона /^\+7\d{10}$/
6. При needs_approval → status='pending_approval', иначе 'sent'
7. Redirect на /dashboard/contracts/{id} после создания
```

### ЗАДАЧА 4 — SMS OTP
```
Прочитай CLAUDE.md и PROJECT_MAP.md → ЗАДАЧА 4.
Реализуй SMS OTP подписание:
1. app/sign/[contractId]/page.tsx — PUBLIC страница (без auth), mobile-first
2. app/api/sign/[contractId]/send-otp/route.ts — генерация + отправка через Mobizon
3. app/api/sign/[contractId]/verify-otp/route.ts — проверка + подписание
4. UI: данные договора → согласие ПД → кнопка SMS → ввод 6 цифр → успех
5. Таймер 60 сек, макс 3 попытки
6. audit_log записи
7. Mobizon API: POST api.mobizon.kz/service/message/sendSmsMessage
```

---

## КРИТИЧЕСКИЕ ПРАВИЛА

1. **НЕ ИСПОЛЬЗУЙ `export const runtime = 'edge'`** — ломает @opennextjs/cloudflare
2. **НЕ ИСПОЛЬЗУЙ framer-motion** — превышает 3МБ лимит Workers
3. **Используй CSS keyframes** для анимаций
4. **Используй lucide-react** для иконок, strokeWidth={1.5}
5. **Все API routes** — в `app/api/` с App Router синтаксисом
6. **RLS включён** — все запросы фильтруются по org_id автоматически
7. **Деплой** — просто `git push` в main, Cloudflare Workers пересоберёт
8. **Тестируй** на `onecontract-dev.fordamirio.workers.dev` или `onecontract.kz`
9. **Кириллица в PDF** — нужен custom font (Inter-Regular.ttf), НЕ StandardFonts

---

## КОГДА СПРАШИВАТЬ В ЧАТЕ (claude.ai)

- Стратегические решения (что делать?)
- Бизнес-модель и позиционирование
- UX/UI решения (как должен выглядеть?)
- Маркетинг и продажи
- Анализ конкурентов
- Юридические вопросы

## КОГДА ДЕЛАТЬ В CLAUDE CODE

- Написание кода
- Баг-фиксы
- Деплой
- Настройка инфраструктуры
- Всё что в PROJECT_MAP.md → раздел "ПРОМПТЫ ДЛЯ CLAUDE CODE"
