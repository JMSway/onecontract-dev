import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TemplateField } from '@/lib/types'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const isPdf = file.type === 'application/pdf'
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (!isPdf && !isDocx) {
    return NextResponse.json({ error: 'Unsupported file type. Use .docx or .pdf' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let text: string
  try {
    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      const { default: pdfParse } = await import('pdf-parse')
      const result = await pdfParse(buffer)
      text = result.text
    }
  } catch (e) {
    console.error('[extract] parse error:', e)
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 422 })
  }

  const excerpt = text.slice(0, 4000)

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  const prompt = `Ты анализируешь шаблон договора на русском языке.
Найди все места где нужно вписать данные: пустые строки (___), скобки [ФИО], «___», поля типа "дата:", "сумма:", "ФИО:", "наименование:", "телефон:".
Верни ТОЛЬКО JSON массив без пояснений, без markdown, без текста до или после:
[{"key":"snake_case","label":"Название на русском","type":"text|number|date|phone|iin|email","required":true}]
Типы: date=дата, number=число/сумма, phone=телефон, iin=ИИН/удостоверение личности, email=email, text=всё остальное.
Ключ (key) должен быть на английском в snake_case.

Текст договора:
${excerpt}`

  // Models ordered by quality. All free (:free suffix = $0 per request).
  // If a provider is rate-limited (429) or unavailable (503/502) we skip to the next.
  const models = [
    'google/gemma-3-12b-it:free',    // Google AI Studio — works well, good Russian
    'google/gemma-3-27b-it:free',    // Larger gemma, better quality
    'google/gemma-3-4b-it:free',     // Smallest gemma, fastest
    'meta-llama/llama-3.3-70b-instruct:free', // Best overall quality
    'google/gemma-4-26b-a4b-it:free', // Newer gemma 4
    'nvidia/nemotron-3-super-120b-a12b:free', // Nvidia, strong model
  ]

  // Statuses that mean "provider overloaded — try next model immediately"
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
          max_tokens: 1024,
        }),
      })

      if (!aiRes.ok) {
        if (RETRY_STATUSES.has(aiRes.status)) {
          console.warn(`[extract] ${model} rate-limited (${aiRes.status}), trying next`)
          continue
        }
        // 400/401/404 — model config error, also skip
        console.warn(`[extract] ${model} error ${aiRes.status}, trying next`)
        continue
      }

      const aiJson = await aiRes.json()
      const content: string = aiJson.choices?.[0]?.message?.content ?? ''
      if (!content) {
        console.warn(`[extract] ${model} returned empty content, trying next`)
        continue
      }

      const parsed = parseAIFields(content)
      if (parsed.length === 0) {
        // Model responded but returned no fields — still usable (no fields found)
        fields = []
        break
      }

      fields = parsed
      console.info(`[extract] success with model ${model}, found ${fields.length} fields`)
      break
    } catch (e) {
      console.warn(`[extract] ${model} threw:`, e)
    }
  }

  // Upload original file to Supabase Storage
  let source_file_url: string | undefined
  try {
    const ext = isDocx ? 'docx' : 'pdf'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('templates')
      .upload(path, buffer, { contentType: file.type })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('templates').getPublicUrl(path)
      source_file_url = urlData.publicUrl
    }
  } catch {
    // Storage upload is non-critical
  }

  return NextResponse.json({ fields, source_file_url })
}

function parseAIFields(content: string): TemplateField[] {
  try {
    // Strip markdown code blocks if present
    const clean = content.replace(/```(?:json)?/g, '').replace(/```/g, '').trim()
    // Find JSON array in the response
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
