import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { applyPatches, fillTemplate } from '@/lib/docx'
import { convertDocxToPdf, readConvertApiSecret } from '@/lib/convertapi'
import type { DocxPatch, TemplateField } from '@/lib/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    source_file_path?: string
    file_kind?: 'docx' | 'pdf'
    patches?: DocxPatch[]
    fields?: TemplateField[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.file_kind !== 'docx' || !body.source_file_path || !body.patches?.length) {
    return NextResponse.json({ error: 'Preview доступен только для DOCX с полями' }, { status: 400 })
  }

  const convertKey = readConvertApiSecret()
  if (!convertKey) {
    return NextResponse.json({ error: 'ConvertAPI не настроен' }, { status: 500 })
  }

  try {
    const serviceSupabase = createServiceClient()
    const { data: blob, error: dlErr } = await serviceSupabase.storage
      .from('templates')
      .download(body.source_file_path)
    if (dlErr || !blob) throw new Error(dlErr?.message ?? 'download failed')

    const rawBytes = new Uint8Array(await blob.arrayBuffer())

    const { bytes: normalized, applied } = applyPatches(rawBytes, body.patches)
    if (applied === 0) {
      return NextResponse.json({ error: 'Не удалось применить поля' }, { status: 400 })
    }

    const fieldLabels: Record<string, string> = {}
    for (const f of body.fields ?? []) {
      fieldLabels[f.key] = `[${f.label || f.key}]`
    }

    const filled = fillTemplate(normalized, fieldLabels)

    const pdfBytes = await convertDocxToPdf(filled, convertKey, 'preview.pdf')

    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[preview-pdf] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ошибка генерации preview' },
      { status: 500 }
    )
  }
}
