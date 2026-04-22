import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateAndStorePdf } from '@/lib/sign-pdf'

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

  // Rate-limit: max 3 regeneration attempts per hour per contract (ConvertAPI billable).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', contractId)
    .in('action', ['pdf_regenerated', 'pdf_generation_failed'])
    .gt('created_at', oneHourAgo)
  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Попробуйте через час.' },
      { status: 429 },
    )
  }

  const { data: sigRes } = await supabase
    .from('signatures')
    .select('signer_ip')
    .eq('contract_id', contractId)
    .maybeSingle()

  const serviceSupabase = createServiceClient()
  const result = await generateAndStorePdf(serviceSupabase, contract, {
    contractId,
    signerPhone: contract.recipient_phone ?? '',
    signerIp: sigRes?.signer_ip ?? null,
    signedAt: contract.signed_at ?? new Date().toISOString(),
    sealHash: contract.pdf_hash ?? '',
  })

  if (!result.pdfUrl) {
    try {
      await supabase.from('audit_log').insert({
        contract_id: contractId,
        action: 'pdf_generation_failed',
        actor: 'system',
        metadata: { via: result.via, error: result.error ?? 'unknown' },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error('[regenerate-pdf] audit_log insert failed:', e)
    }
    return NextResponse.json(
      { error: 'Generation failed', details: result.error ?? 'unknown', via: result.via },
      { status: 500 },
    )
  }

  await supabase.from('contracts').update({ pdf_url: result.pdfUrl }).eq('id', contractId)
  try {
    await supabase.from('audit_log').insert({
      contract_id: contractId,
      action: 'pdf_regenerated',
      actor: 'system',
      metadata: { via: result.via },
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[regenerate-pdf] audit_log insert failed:', e)
  }

  return NextResponse.json({ pdf_url: result.pdfUrl, via: result.via })
}
