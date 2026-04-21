import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyPatches } from '@/lib/docx'
import type { DocxPatch, TemplateField } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.org_id) return NextResponse.json({ templates: [] })

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.org_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 403 })
  }
  if (profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can create templates' }, { status: 403 })
  }

  let body: {
    name?: string
    description?: string
    fields?: TemplateField[]
    source_file_url?: string
    source_file_path?: string
    file_kind?: 'docx' | 'pdf'
    patches?: DocxPatch[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, description, fields, source_file_url, source_file_path, file_kind, patches } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!Array.isArray(fields)) return NextResponse.json({ error: 'Fields must be an array' }, { status: 400 })

  const { data: inserted, error: insertErr } = await supabase
    .from('templates')
    .insert({
      org_id: profile.org_id,
      name: name.trim(),
      description: description?.trim() ?? null,
      fields,
      source_file_url: source_file_url ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Best-effort: build a normalized .docx with {{placeholders}} for layout-preserving signing.
  // Failure here is non-fatal — the sign route falls back to pdf-lib generation.
  let templateDocxUrl: string | null = null
  if (
    file_kind === 'docx' &&
    Array.isArray(patches) &&
    patches.length > 0 &&
    source_file_path
  ) {
    try {
      const { data: rawBlob, error: dlErr } = await supabase.storage
        .from('templates')
        .download(source_file_path)

      if (dlErr || !rawBlob) throw new Error(dlErr?.message ?? 'download failed')

      const rawBytes = new Uint8Array(await rawBlob.arrayBuffer())
      const { bytes: normalized, applied, missed } = applyPatches(rawBytes, patches)
      console.info(`[templates] normalization ${inserted.id}: ${applied} applied, ${missed} missed`)

      if (applied > 0) {
        const normalizedPath = `${inserted.id}_normalized.docx`
        const { error: upErr } = await supabase.storage
          .from('templates')
          .upload(normalizedPath, normalized, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: true,
          })
        if (upErr) throw new Error(upErr.message)

        templateDocxUrl = normalizedPath

        await supabase
          .from('templates')
          .update({ template_docx_url: templateDocxUrl })
          .eq('id', inserted.id)
      }
    } catch (err) {
      console.warn('[templates] normalization failed (non-fatal):', err)
    }
  }

  return NextResponse.json(
    { template: { ...inserted, template_docx_url: templateDocxUrl } },
    { status: 201 },
  )
}
