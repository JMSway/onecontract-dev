import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  if (me.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can view team' }, { status: 403 })
  }

  const { data: members, error } = await supabase
    .from('users')
    .select('id, email, role, needs_approval, created_at')
    .eq('org_id', me.org_id)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ members: members ?? [] })
}
