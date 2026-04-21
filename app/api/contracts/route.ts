import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SendChannel } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let query = supabase
    .from('contracts')
    .select('*, templates(name)')
    .eq('org_id', me.org_id)
    .order('created_at', { ascending: false })

  if (me.role === 'manager') {
    query = query.eq('created_by', user.id)
  }

  const { data: contracts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contracts })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('users')
    .select('org_id, role, needs_approval')
    .eq('id', user.id)
    .single()
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: {
    template_id: string
    data: Record<string, string>
    sent_via: SendChannel
    recipient_name: string
    recipient_phone?: string
    recipient_email?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { template_id, data, sent_via, recipient_name, recipient_phone, recipient_email } = body
  if (!template_id || !data || !sent_via || !recipient_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const status =
    me.needs_approval && me.role === 'manager' ? 'pending_approval' : 'sent'

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      org_id: me.org_id,
      template_id,
      data,
      status,
      sent_via,
      recipient_name,
      recipient_phone: recipient_phone ?? null,
      recipient_email: recipient_email ?? null,
      created_by: user.id,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contract }, { status: 201 })
}
