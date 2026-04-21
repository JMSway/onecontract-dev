import { NextRequest, NextResponse } from 'next/server'
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

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  // Delete any previous OTP for this contract
  await supabase.from('signatures').delete().eq('contract_id', contractId)

  const { error } = await supabase.from('signatures').insert({
    contract_id: contractId,
    method: 'sms_otp',
    otp_code: code,
    created_at: new Date().toISOString(),
    // Store expiry in signer_ua field temporarily until we add expires_at column
    // TODO: add expires_at column to signatures table
    signer_ua: expiresAt,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // TEMPORARY: return code in response for testing
  // TODO: replace with Mobizon SMS before production
  return NextResponse.json({ success: true, code })
}
