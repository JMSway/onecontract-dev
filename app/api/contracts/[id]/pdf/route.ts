import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ensureSignedPdfUrl } from '@/lib/pdf-cache'

/**
 * Redirect to a fresh signed URL for the contract's PDF.
 * Used by manager dashboards and email links so downloads keep working past
 * the underlying signed-URL TTL without needing to regenerate the PDF.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: me } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!me?.org_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, org_id, status')
    .eq('id', id)
    .maybeSingle()
  if (!contract || contract.org_id !== me.org_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (contract.status !== 'signed') {
    return NextResponse.json({ error: 'Not signed yet' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()
  const freshUrl = await ensureSignedPdfUrl(serviceSupabase, id)
  if (!freshUrl) {
    return NextResponse.json({ error: 'PDF not found in storage' }, { status: 404 })
  }

  return NextResponse.redirect(freshUrl, 302)
}
