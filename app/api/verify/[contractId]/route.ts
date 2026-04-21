import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  // Fetch contract with template and org via joins
  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, signed_at, created_at, recipient_name, template_id, org_id')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) {
    return NextResponse.json({ error: 'Договор не найден' }, { status: 404 })
  }

  // Fetch template name and org name separately (RLS allows these)
  const [templateRes, orgRes] = await Promise.all([
    supabase.from('templates').select('name').eq('id', contract.template_id).maybeSingle(),
    supabase.from('organizations').select('name').eq('id', contract.org_id).maybeSingle(),
  ])

  return NextResponse.json({
    id: contract.id,
    status: contract.status,
    signed_at: contract.signed_at,
    created_at: contract.created_at,
    recipient_name: contract.recipient_name,
    template_name: templateRes.data?.name ?? 'Договор',
    org_name: orgRes.data?.name ?? 'Организация',
    sign_method: 'sms_otp',
  })
}
