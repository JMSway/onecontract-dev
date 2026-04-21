import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, status, recipient_name, recipient_phone, recipient_email, sent_via, data, template_id, org_id, created_at, sent_at, viewed_at, signed_at')
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
    .select('name, fields')
    .eq('id', contract.template_id)
    .maybeSingle()

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
    },
    template: template ?? { name: 'Договор', fields: [] },
    org: { name: org?.name ?? 'Организация' },
  })
}
