import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, org_id, recipient_phone, template_id')
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
    .select('id, otp_code, signer_ua, otp_verified_at, otp_attempts')
    .eq('contract_id', contractId)
    .maybeSingle()

  if (!sig || !sig.otp_code) {
    return NextResponse.json({ success: false, error: 'Код не найден. Запросите новый.' })
  }

  if ((sig.otp_attempts ?? 0) >= 5) {
    await supabase.from('signatures').update({ otp_code: null }).eq('id', sig.id)
    return NextResponse.json(
      { success: false, error: 'Превышено количество попыток. Запросите новый код.' },
      { status: 429 }
    )
  }

  // signer_ua stores expiry ISO string temporarily
  const expiresAt = sig.signer_ua ? new Date(sig.signer_ua).getTime() : 0
  if (Date.now() > expiresAt) {
    return NextResponse.json({ success: false, error: 'Код истёк. Запросите новый.' })
  }

  const inputHash = createHash('sha256').update(body.code).digest('hex')
  if (inputHash !== sig.otp_code) {
    await supabase
      .from('signatures')
      .update({ otp_attempts: (sig.otp_attempts ?? 0) + 1 })
      .eq('id', sig.id)
    return NextResponse.json({ success: false, error: 'Неверный код. Проверьте и попробуйте снова.' })
  }

  const now = new Date().toISOString()

  // Generate seal hash (HMAC-SHA256 with server secret)
  const secret = process.env.SEAL_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured (SEAL_SECRET)' }, { status: 500 })
  }
  const sealData = JSON.stringify({
    contractId,
    signedAt: now,
    signerPhone: contract.recipient_phone,
    method: 'sms_otp',
    templateId: contract.template_id,
  })
  const sealHash = createHmac('sha256', secret).update(sealData).digest('hex')

  const signerIp =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    null
  const signerUa = request.headers.get('user-agent') ?? null

  await Promise.all([
    supabase
      .from('contracts')
      .update({ status: 'signed', signed_at: now, pdf_hash: sealHash })
      .eq('id', contractId),
    supabase
      .from('signatures')
      .update({ otp_verified_at: now, signer_ip: signerIp, signer_ua: signerUa })
      .eq('id', sig.id),
    supabase.from('audit_log').insert({
      contract_id: contractId,
      action: 'contract_signed',
      actor: 'client',
      metadata: { method: 'sms_otp', sealHash },
      created_at: now,
    }),
  ])

  return NextResponse.json({ success: true })
}
