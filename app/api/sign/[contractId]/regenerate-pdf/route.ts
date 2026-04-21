import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { generateSignedContractPdf } from '@/lib/pdf'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, org_id, template_id, data, recipient_phone, signed_at, pdf_hash')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (contract.status !== 'signed') {
    return NextResponse.json({ error: 'Contract not signed yet' }, { status: 403 })
  }

  const [templateRes, orgRes, sigRes] = await Promise.all([
    supabase.from('templates').select('name, fields').eq('id', contract.template_id).maybeSingle(),
    supabase.from('organizations').select('name').eq('id', contract.org_id).maybeSingle(),
    supabase.from('signatures').select('signer_ip').eq('contract_id', contractId).maybeSingle(),
  ])

  const fields = (templateRes.data?.fields ?? []) as Array<{
    key: string; label: string; filled_by?: string
  }>
  const data = (contract.data ?? {}) as Record<string, string>

  const managerFields = fields
    .filter((f) => (f.filled_by ?? 'manager') === 'manager' && data[f.key])
    .map((f) => ({ label: f.label, value: data[f.key] }))

  const clientFields = fields
    .filter((f) => f.filled_by === 'client')
    .map((f) => ({ label: f.label, value: data[f.key] ?? '—' }))

  try {
    const qrPngBuffer = await QRCode.toBuffer(
      `https://onecontract.kz/verify/${contractId}`,
      { width: 200, margin: 2, type: 'png', color: { dark: '#000926', light: '#FFFFFF' } }
    ) as Buffer

    const pdfBytes = await generateSignedContractPdf({
      contractId,
      orgName: orgRes.data?.name ?? 'Организация',
      templateName: templateRes.data?.name ?? 'Договор',
      managerFields,
      clientFields,
      signerPhone: contract.recipient_phone ?? '',
      signerIp: sigRes.data?.signer_ip ?? null,
      signedAt: contract.signed_at ?? new Date().toISOString(),
      sealHash: contract.pdf_hash ?? '',
      qrPngBuffer,
    })

    const { error: uploadErr } = await supabase.storage
      .from('contracts')
      .upload(`${contractId}.pdf`, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) {
      console.error('PDF upload failed:', uploadErr)
      return NextResponse.json({ error: 'Upload failed', details: uploadErr.message }, { status: 500 })
    }

    const { data: signed } = await supabase.storage
      .from('contracts')
      .createSignedUrl(`${contractId}.pdf`, 7 * 24 * 60 * 60)

    const pdfUrl = signed?.signedUrl ?? null
    if (pdfUrl) {
      await supabase.from('contracts').update({ pdf_url: pdfUrl }).eq('id', contractId)
    }

    return NextResponse.json({ pdf_url: pdfUrl })
  } catch (err) {
    console.error('PDF generation failed:', err)
    return NextResponse.json(
      { error: 'Generation failed', details: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
