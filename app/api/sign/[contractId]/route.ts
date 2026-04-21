import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ensureSignedPdfUrl } from '@/lib/pdf-cache'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, status, recipient_name, recipient_phone, recipient_email, sent_via, data, template_id, org_id, created_at, sent_at, viewed_at, signed_at, pdf_url')
    .eq('id', contractId)
    .maybeSingle()

  if (error || !contract) {
    return NextResponse.json({ error: 'Договор не найден' }, { status: 404 })
  }

  if (!['sent', 'viewed', 'signed'].includes(contract.status)) {
    return NextResponse.json({ error: 'Договор недоступен для подписания' }, { status: 403 })
  }

  // Mark as viewed on first open
  if (contract.status === 'sent') {
    await supabase
      .from('contracts')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', contractId)
  }

  // Get template
  const { data: template } = await supabase
    .from('templates')
    .select('name, fields, source_file_url')
    .eq('id', contract.template_id)
    .maybeSingle()

  // Refresh signed URL (stored one may have expired)
  let sourceFileUrl: string | null = null
  if (template?.source_file_url) {
    const stored = template.source_file_url
    const parts = stored.split('/templates/')
    const rawPath = parts.length > 1 ? parts[parts.length - 1].split('?')[0] : null
    const path = rawPath ? decodeURIComponent(rawPath) : null
    if (path) {
      const serviceSupabase = createServiceClient()
      const { data: fresh, error: signErr } = await serviceSupabase.storage
        .from('templates')
        .createSignedUrl(path, 60 * 60)
      sourceFileUrl = fresh?.signedUrl ?? null
      if (!sourceFileUrl) {
        await supabase.from('audit_log').insert({
          contract_id: contractId,
          action: 'source_file_url_refresh_failed',
          actor: 'system',
          metadata: { path, error: signErr?.message ?? 'unknown' },
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  // Lazy re-sign: always hand back a fresh long-lived URL if the file exists.
  let pdfUrl: string | null = null
  if (contract.status === 'signed') {
    const serviceSupabase = createServiceClient()
    pdfUrl = await ensureSignedPdfUrl(serviceSupabase, contractId)
  }

  // Get org name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', contract.org_id)
    .maybeSingle()

  // Mask phone — only last 4 digits
  const phone = contract.recipient_phone
  const maskedPhone = phone
    ? phone.replace(/(\+\d)(\d+)(\d{4})$/, (_: string, prefix: string, mid: string, last: string) =>
        prefix + '*'.repeat(mid.length) + last
      )
    : null

  return NextResponse.json({
    contract: {
      id: contract.id,
      status: contract.status === 'sent' ? 'viewed' : contract.status,
      recipient_name: contract.recipient_name,
      recipient_phone_masked: maskedPhone,
      sent_via: contract.sent_via,
      data: contract.data,
      signed_at: contract.signed_at,
      pdf_url: pdfUrl,
    },
    template: {
      name: template?.name ?? 'Договор',
      fields: template?.fields ?? [],
      source_file_url: sourceFileUrl,
    },
    org: { name: org?.name ?? 'Организация' },
  })
}
