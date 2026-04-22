import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type FieldType = 'text' | 'number' | 'date' | 'iin' | 'phone' | 'email'

interface TemplateField {
  key: string
  label: string
  type: FieldType
  required?: boolean
  filled_by?: 'manager' | 'client'
}

const validators: Record<FieldType, (v: string) => boolean> = {
  text: (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 500,
  number: (v) => /^-?\d+(\.\d+)?$/.test(v),
  date: (v) => {
    if (!v || typeof v !== 'string') return false
    if (!isNaN(Date.parse(v))) return true
    const ddmmyyyy = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (ddmmyyyy) {
      const [, d, m, y] = ddmmyyyy
      const date = new Date(+y, +m - 1, +d)
      return date.getFullYear() === +y && date.getMonth() === +m - 1
    }
    const months: Record<string, number> = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
      'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
    }
    const textMatch = v.toLowerCase().match(/^(\d{1,2})\s+([а-яa-z]+)\s+(\d{4})$/)
    if (textMatch) {
      const [, , mName] = textMatch
      return months[mName] !== undefined
    }
    return false
  },
  iin: (v) => /^\d{12}$/.test(v),
  phone: (v) => /^\+?\d{10,15}$/.test(v.replace(/[\s\-()]/g, '')),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, data, template_id')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['sent', 'viewed'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contract not in signable state' }, { status: 403 })
  }

  let body: { clientData: Record<string, string> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.clientData || typeof body.clientData !== 'object') {
    return NextResponse.json({ error: 'clientData required' }, { status: 400 })
  }

  const { data: template } = await supabase
    .from('templates')
    .select('fields')
    .eq('id', contract.template_id)
    .maybeSingle()

  const templateFields = (template?.fields ?? []) as TemplateField[]
  const managerData = (contract.data ?? {}) as Record<string, string>

  // Allowed keys: template fields that are either filled_by='client'
  // or not already filled by manager.
  const allowedKeys = new Set(
    templateFields
      .filter((f) => {
        const isClient = (f.filled_by ?? 'manager') === 'client'
        const notFilledByManager = !(f.key in managerData) || !managerData[f.key]
        return isClient || notFilledByManager
      })
      .map((f) => f.key)
  )

  const errors: Record<string, string> = {}
  const cleaned: Record<string, string> = {}

  for (const [key, rawValue] of Object.entries(body.clientData)) {
    if (!allowedKeys.has(key)) {
      errors[key] = 'Поле недоступно для редактирования'
      continue
    }
    const field = templateFields.find((f) => f.key === key)
    if (!field) {
      errors[key] = 'Неизвестное поле'
      continue
    }
    const value = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '')
    if (!value) {
      if (field.required) errors[key] = 'Обязательное поле'
      continue
    }
    const validate = validators[field.type] ?? validators.text
    if (!validate(value)) {
      errors[key] = `Некорректный формат (${field.type})`
      continue
    }
    cleaned[key] = value
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Ошибки валидации', fieldErrors: errors }, { status: 400 })
  }

  const merged = { ...managerData, ...cleaned }

  const { error } = await supabase
    .from('contracts')
    .update({ data: merged })
    .eq('id', contractId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
