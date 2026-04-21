import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, recipient_phone')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['sent', 'viewed'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contract not in signable state' }, { status: 403 })
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const codeHash = createHash('sha256').update(code).digest('hex')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  if (process.env.NODE_ENV === 'development') console.log('OTP:', code)

  // Send SMS via Mobizon
  const recipient = (contract.recipient_phone ?? '').replace(/^\+/, '')
  const apiKey = process.env.MOBIZON_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'SMS не настроен' }, { status: 500 })

  const smsRes = await fetch(
    `https://api.mobizon.kz/service/message/sendSmsMessage?output=json&apiKey=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient,
        text: `OneContract: код подписания ${code}. Не сообщайте никому.`,
      }),
    }
  )

  const smsData = await smsRes.json().catch(() => null)
  if (!smsData || smsData.code !== 0) {
    const msg = smsData?.message ?? 'Ошибка отправки SMS'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  await supabase.from('signatures').delete().eq('contract_id', contractId)

  const { error } = await supabase.from('signatures').insert({
    contract_id: contractId,
    method: 'sms_otp',
    otp_code: codeHash,
    created_at: new Date().toISOString(),
    signer_ua: expiresAt,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
