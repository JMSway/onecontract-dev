import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase/server'
import type { TemplateField, DocxPatch } from '@/lib/types'
import { EXTRACT_SYSTEM_PROMPT, buildUserPrompt } from '@/lib/ai-extract-prompt'

function readOpenrouterKey(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env?.OPENROUTER_API_KEY) return env.OPENROUTER_API_KEY
  } catch {
    // not running inside Cloudflare runtime (e.g. `next dev`) — fall through
  }
  return process.env.OPENROUTER_API_KEY
}

function readGroqKey(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env?.GROQ_API_KEY) return env.GROQ_API_KEY
  } catch {}
  return process.env.GROQ_API_KEY
}

type Message = { role: string; content: string }

async function callAI(messages: Message[]): Promise<string | null> {
  // Level 1: Groq (primary — fast and stable)
  const groqKey = readGroqKey()
  if (groqKey) {
    for (const model of ['llama-3.3-70b-versatile', 'gemma2-9b-it']) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 4096 }),
        })
        if (!res.ok) { console.warn(`[extract] Groq ${model} error ${res.status}`); continue }
        const json = await res.json()
        const content: string = json.choices?.[0]?.message?.content ?? ''
        if (content) { console.info(`[extract] Groq ${model} success`); return content }
      } catch (e) { console.warn(`[extract] Groq ${model} threw:`, e) }
    }
  }

  // Level 2: OpenRouter (fallback)
  const openrouterKey = readOpenrouterKey()
  if (openrouterKey) {
    for (const model of ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-3-27b-it:free', 'google/gemma-3-12b-it:free']) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://onecontract.kz',
            'X-Title': 'OneContract',
          },
          body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 4096 }),
        })
        if (!res.ok) { console.warn(`[extract] OpenRouter ${model} error ${res.status}`); continue }
        const json = await res.json()
        const content: string = json.choices?.[0]?.message?.content ?? ''
        if (content) { console.info(`[extract] OpenRouter ${model} success`); return content }
      } catch (e) { console.warn(`[extract] OpenRouter ${model} threw:`, e) }
    }
  }

  return null
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

  const excerpt = text.slice(0, 8000)

  const messages = [
    { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(excerpt) },
  ]

  const content = await callAI(messages)
  if (!content) {
    return NextResponse.json({ fields: [], patches: [], aiUnavailable: true }, { status: 200 })
  }

  const parsed = parseAIResponse(content)
  if (parsed.fields.length === 0) {
    return NextResponse.json({ fields: [], patches: [], aiUnavailable: true }, { status: 200 })
  }

  const fields = dedupeFields(parsed.fields)
  const patches = dedupePatches(validatePatches(parsed.patches, fields, excerpt))
  console.info(`[extract] → ${fields.length} fields, ${patches.length} patches`)

  return NextResponse.json({ fields, patches })
}

function autoFilledBy(key: string): TemplateField['filled_by'] {
  const clientKeys = [
    // identity / personal data
    'iin', 'address', 'document', 'passport', 'issued', 'resident',
    'phone', 'email', 'mobile',
    // name fields
    'name', 'fio', 'full_name', 'fullname',
    // role-based personal fields
    'student', 'client', 'zakazchik', 'customer', 'buyer',
    'parent', 'guardian', 'child', 'pupil',
    // birth / biometric
    'born', 'birth', 'dob', 'signer',
  ]
  const lower = key.toLowerCase()
  if (clientKeys.some((k) => lower.includes(k))) return 'client'
  return 'manager'
}

function parseAIResponse(content: string): { fields: TemplateField[]; patches: DocxPatch[] } {
  const empty = { fields: [] as TemplateField[], patches: [] as DocxPatch[] }
  try {
    const clean = content.replace(/```(?:json)?/g, '').replace(/```/g, '').trim()

    const objMatch = clean.match(/\{[\s\S]*\}/)
    if (objMatch) {
      try {
        const parsed = JSON.parse(objMatch[0])
        return {
          fields: normalizeFields(parsed.fields),
          patches: normalizePatches(parsed.patches),
        }
      } catch {
        // fall through to array-only parsing
      }
    }

    // Back-compat: some models may still return a bare array of fields
    const arrMatch = clean.match(/\[[\s\S]*\]/)
    if (arrMatch) {
      try {
        const parsed = JSON.parse(arrMatch[0])
        if (Array.isArray(parsed)) {
          return { fields: normalizeFields(parsed), patches: [] }
        }
      } catch {
        // ignore
      }
    }

    return empty
  } catch {
    return empty
  }
}

function normalizeFields(raw: unknown): TemplateField[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
    .map((f) => {
      const key = String(f.key ?? '').replace(/[^a-z0-9_]/gi, '_').toLowerCase()
      const aiFilledBy = f.filled_by === 'manager' || f.filled_by === 'client'
        ? (f.filled_by as 'manager' | 'client')
        : undefined
      return {
        key,
        label: String(f.label ?? f.key ?? ''),
        type: validateFieldType(f.type),
        required: Boolean(f.required ?? true),
        filled_by: aiFilledBy ?? autoFilledBy(key),
        group: validateGroup(f.group),
      }
    })
    .filter((f) => f.key.length > 0)
}

function validateGroup(g: unknown): TemplateField['group'] {
  const valid: NonNullable<TemplateField['group']>[] = ['customer', 'student', 'contract', 'payment', 'other']
  return valid.includes(g as NonNullable<TemplateField['group']>) ? (g as NonNullable<TemplateField['group']>) : 'other'
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (j === 0 ? i : 0)),
  )
  for (let j = 1; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function dedupeFields(fields: TemplateField[]): TemplateField[] {
  const kept: TemplateField[] = []
  for (const f of fields) {
    const isDup = kept.some(
      (k) => levenshtein(k.label.toLowerCase(), f.label.toLowerCase()) < 4,
    )
    if (!isDup) kept.push(f)
  }
  return kept
}

function normalizePatches(raw: unknown): DocxPatch[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map((p) => ({
      search: String(p.search ?? '').trim(),
      replace: String(p.replace ?? '').trim(),
    }))
    .filter((p) => p.search.length > 0 && p.replace.includes('{{'))
}

/**
 * Drop patches whose `search` doesn't occur exactly once in the source excerpt,
 * or whose placeholder doesn't match any known field key. The fill step can still
 * succeed on the remaining patches; ambiguous ones fall back to pdf-lib.
 */
function validatePatches(patches: DocxPatch[], fields: TemplateField[], source: string): DocxPatch[] {
  const validKeys = new Set(fields.map((f) => f.key))
  return patches.filter((p) => {
    const tokenMatch = p.replace.match(/\{\{\s*([a-z0-9_]+)\s*\}\}/i)
    if (!tokenMatch || !validKeys.has(tokenMatch[1].toLowerCase())) return false
    const occurrences = countOccurrences(source, p.search)
    return occurrences === 1
  })
}

function dedupePatches(patches: DocxPatch[]): DocxPatch[] {
  const seen = new Set<string>()
  const out: DocxPatch[] = []
  for (const p of patches) {
    if (seen.has(p.search)) continue
    seen.add(p.search)
    out.push(p)
  }
  return out
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let idx = 0
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++
    idx += needle.length
  }
  return count
}

function validateFieldType(t: unknown): TemplateField['type'] {
  const valid: TemplateField['type'][] = ['text', 'number', 'date', 'iin', 'phone', 'email']
  return valid.includes(t as TemplateField['type']) ? (t as TemplateField['type']) : 'text'
}
