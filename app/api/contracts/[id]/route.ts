import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
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
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!me?.org_id) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [contractRes, pdfLogRes] = await Promise.all([
    supabase
      .from('contracts')
      .select('*, templates(name, fields)')
      .eq('id', id)
      .eq('org_id', me.org_id)
      .single(),
    supabase
      .from('audit_log')
      .select('metadata')
      .eq('contract_id', id)
      .eq('action', 'pdf_generated')
      .maybeSingle(),
  ])

  if (contractRes.error || !contractRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const pdfVia = (pdfLogRes.data?.metadata as Record<string, string> | null)?.via ?? null
  return NextResponse.json({ contract: contractRes.data, pdfVia })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  if (me.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { data: contract } = await supabase
    .from('contracts')
    .select('id, org_id, pdf_url, retention_until, status')
    .eq('id', id)
    .eq('org_id', me.org_id)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (contract.retention_until && new Date(contract.retention_until) > new Date()) {
    return NextResponse.json(
      { error: `Договор хранится до ${new Date(contract.retention_until).toLocaleDateString('ru-RU')} (ГК РК ст.178)` },
      { status: 403 }
    )
  }

  // Remove PDF from Storage if it exists
  if (contract.pdf_url) {
    try {
      await supabase.storage.from('contracts').remove([`${id}.pdf`])
    } catch {
      // Non-fatal — proceed with DB delete
    }
  }

  await supabase.from('contracts').delete().eq('id', id)

  return new NextResponse(null, { status: 204 })
}
