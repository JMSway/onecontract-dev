import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/mobizon'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.org_id) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, recipient_phone, recipient_name, org_id, template_id')
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!contract.recipient_phone) {
    return NextResponse.json({ error: 'Номер телефона не указан' }, { status: 400 })
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', id)
    .eq('action', 'link_sent_sms')
    .gt('created_at', oneHourAgo)
  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'Максимум 3 SMS в час. Попробуйте позже.' },
      { status: 429 }
    )
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', contract.org_id)
    .maybeSingle()
  const orgName = org?.name ?? 'OneContract'

  const signingUrl = `https://onecontract.kz/sign/${contract.id}`
  const text = `${orgName}: подпишите договор по ссылке ${signingUrl}`

  const result = await sendSms(contract.recipient_phone, text)
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, mobizonCode: result.code },
      { status: 500 }
    )
  }

  const update: { status?: string; sent_at?: string; sent_via: 'sms' } = { sent_via: 'sms' }
  if (contract.status === 'draft') {
    update.status = 'sent'
    update.sent_at = new Date().toISOString()
  }
  await supabase.from('contracts').update(update).eq('id', id)

  await supabase.from('audit_log').insert({
    contract_id: id,
    action: 'link_sent_sms',
    actor: 'manager',
    metadata: { recipientPhone: contract.recipient_phone },
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
