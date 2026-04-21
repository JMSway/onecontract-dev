import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: me } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (me.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can approve' }, { status: 403 })
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, org_id')
    .eq('id', id)
    .eq('org_id', me.org_id)
    .maybeSingle()
  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (contract.status !== 'pending_approval') {
    return NextResponse.json({ error: 'Contract is not pending approval' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('contracts')
    .update({ status: 'sent', sent_at: now, approved_by: user.id })
    .eq('id', id)
    .eq('org_id', me.org_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    contract_id: id,
    action: 'contract_approved',
    actor: user.id,
    metadata: {},
    created_at: now,
  })

  return NextResponse.json({ success: true })
}
