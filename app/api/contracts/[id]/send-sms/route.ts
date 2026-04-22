import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase/server'

function readMobizonKey(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env?.MOBIZON_API_KEY) return env.MOBIZON_API_KEY
  } catch {
    // not running inside Cloudflare runtime (e.g. `next dev`) — fall through
  }
  return process.env.MOBIZON_API_KEY
}

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

  const apiKey = readMobizonKey()
  if (!apiKey) return NextResponse.json({ error: 'SMS не настроен' }, { status: 500 })

  const recipient = contract.recipient_phone.replace(/^\+/, '')
  const text = `${orgName}: подпишите договор по ссылке ${signingUrl}`

  const smsRes = await fetch(
    `https://api.mobizon.kz/service/message/sendSmsMessage?output=json&apiKey=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, text }),
    }
  )

  const smsData = (await smsRes.json().catch(() => null)) as { code?: number; message?: string } | null
  if (!smsData || smsData.code !== 0) {
    return NextResponse.json(
      { error: smsData?.message ?? 'Ошибка отправки SMS' },
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
