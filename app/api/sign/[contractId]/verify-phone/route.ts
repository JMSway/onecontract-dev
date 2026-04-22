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
    .select('recipient_phone, status')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['sent', 'viewed'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contract not in signable state' }, { status: 403 })
  }

  let body: { phone: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('signatures')
    .select('id, phone_attempts')
    .eq('contract_id', contractId)
    .maybeSingle()

  const attempts = existing?.phone_attempts ?? 0
  if (attempts >= 5) {
    return NextResponse.json(
      { match: false, error: 'Превышено количество попыток. Попробуйте позже.' },
      { status: 429 }
    )
  }

  const normalize = (p: string) => p.replace(/[\s\-()]/g, '')
  const match = normalize(body.phone) === normalize(contract.recipient_phone ?? '')

  if (!match) {
    if (existing) {
      await supabase
        .from('signatures')
        .update({ phone_attempts: attempts + 1 })
        .eq('id', existing.id)
    } else {
      await supabase.from('signatures').upsert(
        {
          contract_id: contractId,
          method: 'sms_otp',
          phone_attempts: 1,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'contract_id', ignoreDuplicates: false },
      )
    }
    return NextResponse.json({ match: false, error: 'Номер не совпадает с указанным в договоре' })
  }

  if (existing && existing.phone_attempts > 0) {
    await supabase.from('signatures').update({ phone_attempts: 0 }).eq('id', existing.id)
  }
  return NextResponse.json({ match: true })
}
