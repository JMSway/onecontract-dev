import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await params

  const { data: me } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (me.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can manage team' }, { status: 403 })
  }

  let body: { needs_approval?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.needs_approval !== 'boolean') {
    return NextResponse.json({ error: 'needs_approval required' }, { status: 400 })
  }

  const { data: target } = await supabase
    .from('users')
    .select('id, org_id, role')
    .eq('id', userId)
    .eq('org_id', me.org_id)
    .maybeSingle()
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.role !== 'manager') {
    return NextResponse.json({ error: 'Can only modify managers' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update({ needs_approval: body.needs_approval })
    .eq('id', userId)
    .eq('org_id', me.org_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
