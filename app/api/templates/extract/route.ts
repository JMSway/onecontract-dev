import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase/server'
import type { TemplateField } from '@/lib/types'

function readOpenrouterKey(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env?.OPENROUTER_API_KEY) return env.OPENROUTER_API_KEY
  } catch {
    // not running inside Cloudflare runtime (e.g. `next dev`) — fall through
  }
  return process.env.OPENROUTER_API_KEY
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { text?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text } = body
  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  const apiKey = readOpenrouterKey()
  if (!apiKey) {
    return NextResponse.json({ fields: [], aiUnavailable: true }, { status: 200 })
  }

  const excerpt = text.slice(0, 8000)

  const prompt = `Ты извлекаешь переменные поля из шаблона договора казахстанской школы/образовательного центра.

ЗАДАЧА: найти ВСЕ поля, которые меняются от договора к договору — данные конкретного клиента, суммы, даты, номера.

ТИПОВЫЕ ПОЛЯ В ТАКИХ ДОГОВОРАХ (ищи все, что применимо):
• Номер договора, дата договора
• Реквизиты исполнителя: название, БИН, ФИО директора, юр. адрес
• Данные заказчика: ФИО, ИИН, номер удостоверения, кем выдан, адрес проживания, телефон, email
• Если есть ребёнок/обучающийся: ФИО ребёнка, ИИН ребёнка, дата рождения
• Данные родителя/законного представителя (отдельно от заказчика если упомянуто)
• Предмет: название курса/платформы/услуги, уровень, количество часов/занятий
• Финансы: сумма оплаты, сумма со скидкой, размер скидки, срок оплаты, валюта
• Срок действия: дата начала, дата окончания, количество месяцев

КАК НАХОДИТЬ ПОЛЯ:
- Явные маркеры: «___», «____», «[___]», «(____)», «{поле}», «____________»
- Метки с двоеточием: «ФИО:», «ИИН:», «Сумма:», «Дата:»
- Скобочки: «[ФИО Заказчика]», «(наименование)»
- Упоминания данных без значения в соседней ячейке/строке таблицы

ПРАВИЛА ВЫВОДА:
- key: английский snake_case (student_name, parent_iin, payment_amount, contract_number)
- label: русский, как в документе («ФИО Заказчика», не «Имя»)
- type: "date" | "number" | "phone" | "iin" | "email" | "text"
  - "date" для всех дат (договора, оплаты, рождения)
  - "number" для сумм, количества часов, размера скидки
  - "iin" для ИИН и удостоверений
  - "phone" для телефонов, "email" для email
  - "text" для всего остального
- required: true если поле в договоре обязательно (обычно — все поля обязательны)

Верни ТОЛЬКО JSON-массив, БЕЗ markdown-обёртки, БЕЗ пояснений:
[{"key":"contract_number","label":"Номер договора","type":"text","required":true}]

Пример для короткого фрагмента «Договор №___ от ___ г. Исполнитель: ___, БИН ___, в лице директора ___»:
[
  {"key":"contract_number","label":"Номер договора","type":"text","required":true},
  {"key":"contract_date","label":"Дата договора","type":"date","required":true},
  {"key":"executor_name","label":"Наименование Исполнителя","type":"text","required":true},
  {"key":"executor_bin","label":"БИН Исполнителя","type":"text","required":true},
  {"key":"executor_director","label":"ФИО директора Исполнителя","type":"text","required":true}
]

ТЕКСТ ДОГОВОРА:
${excerpt}`

  // Models ordered by reliability. All free ($0 per request).
  // On 429/502/503/504 (provider overloaded) — try next model immediately.
  const models = [
    'google/gemma-3-12b-it:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3-4b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
  ]

  const RETRY_STATUSES = new Set([429, 502, 503, 504])

  let fields: TemplateField[] = []
  for (const model of models) {
    try {
      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://onecontract.kz',
          'X-Title': 'OneContract',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 2048,
        }),
      })

      if (!aiRes.ok) {
        if (RETRY_STATUSES.has(aiRes.status)) {
          console.warn(`[extract] ${model} rate-limited (${aiRes.status}), trying next`)
          continue
        }
        console.warn(`[extract] ${model} error ${aiRes.status}, trying next`)
        continue
      }

      const aiJson = await aiRes.json()
      const content: string = aiJson.choices?.[0]?.message?.content ?? ''
      if (!content) {
        console.warn(`[extract] ${model} returned empty content, trying next`)
        continue
      }

      fields = parseAIFields(content)
      console.info(`[extract] success with ${model}, found ${fields.length} fields`)
      break
    } catch (e) {
      console.warn(`[extract] ${model} threw:`, e)
    }
  }

  return NextResponse.json({ fields })
}

function parseAIFields(content: string): TemplateField[] {
  try {
    const clean = content.replace(/```(?:json)?/g, '').replace(/```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    if (!match) return []
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
      .map((f) => ({
        key: String(f.key ?? '').replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
        label: String(f.label ?? f.key ?? ''),
        type: validateFieldType(f.type),
        required: Boolean(f.required ?? true),
      }))
      .filter((f) => f.key.length > 0)
  } catch {
    return []
  }
}

function validateFieldType(t: unknown): TemplateField['type'] {
  const valid: TemplateField['type'][] = ['text', 'number', 'date', 'iin', 'phone', 'email']
  return valid.includes(t as TemplateField['type']) ? (t as TemplateField['type']) : 'text'
}
