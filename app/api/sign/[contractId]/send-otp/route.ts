import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['sent', 'viewed'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contract not in signable state' }, { status: 403 })
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const codeHash = createHash('sha256').update(code).digest('hex')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  await supabase.from('signatures').delete().eq('contract_id', contractId)

  const { error } = await supabase.from('signatures').insert({
    contract_id: contractId,
    method: 'sms_otp',
    otp_code: codeHash,
    created_at: new Date().toISOString(),
    signer_ua: expiresAt,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // TODO: replace testCode with Mobizon SMS before production
  return NextResponse.json({ success: true, testCode: code })
}
