import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, org_id')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['sent', 'viewed'].includes(contract.status)) {
    return NextResponse.json({ error: 'Already signed or invalid state' }, { status: 403 })
  }

  let body: { code: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: sig } = await supabase
    .from('signatures')
    .select('id, otp_code, signer_ua, otp_verified_at')
    .eq('contract_id', contractId)
    .maybeSingle()

  if (!sig) return NextResponse.json({ success: false, error: 'Код не найден. Запросите новый.' })

  // Check expiry (stored in signer_ua temporarily)
  const expiresAt = sig.signer_ua ? new Date(sig.signer_ua).getTime() : 0
  if (Date.now() > expiresAt) {
    return NextResponse.json({ success: false, error: 'Код истёк. Запросите новый.' })
  }

  if (sig.otp_code !== body.code) {
    return NextResponse.json({ success: false, error: 'Неверный код. Проверьте и попробуйте снова.' })
  }

  const now = new Date().toISOString()

  await Promise.all([
    supabase
      .from('contracts')
      .update({ status: 'signed', signed_at: now })
      .eq('id', contractId),
    supabase
      .from('signatures')
      .update({ otp_verified_at: now })
      .eq('id', sig.id),
    supabase.from('audit_log').insert({
      contract_id: contractId,
      action: 'contract_signed',
      actor: 'client',
      created_at: now,
    }),
  ])

  return NextResponse.json({ success: true })
}
