import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('recipient_phone, status')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['sent', 'viewed'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contract not in signable state' }, { status: 403 })
  }

  let body: { phone: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Normalize: strip spaces/dashes for comparison
  const normalize = (p: string) => p.replace(/[\s\-()]/g, '')
  const match = normalize(body.phone) === normalize(contract.recipient_phone ?? '')

  if (!match) {
    return NextResponse.json({ match: false, error: 'Номер не совпадает с указанным в договоре' })
  }
  return NextResponse.json({ match: true })
}
