import QRCode from 'qrcode'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateSignedContractPdf, appendSealPage } from './pdf'
import { fillTemplate } from './docx'
import { convertDocxToPdf, readConvertApiSecret } from './convertapi'

export type SignedPdfMetadata = {
  contractId: string
  signerPhone: string
  signerIp: string | null
  signedAt: string
  sealHash: string
}

export type GenerationResult = {
  pdfUrl: string | null
  via: 'docx' | 'pdf_lib' | 'none'
  error?: string
}

type ContractLike = {
  template_id: string | null
  org_id: string
  data: Record<string, string> | null
}

type TemplateRow = {
  name: string | null
  fields: Array<{ key: string; label: string; filled_by?: string }> | null
  template_docx_url?: string | null
}

async function buildQr(contractId: string): Promise<Buffer> {
  return QRCode.toBuffer(
    `https://onecontract.kz/verify/${contractId}`,
    { width: 280, margin: 2, type: 'png', color: { dark: '#000926', light: '#FFFFFF' } },
  ) as Promise<Buffer>
}

async function uploadAndSign(
  supabase: SupabaseClient,
  contractId: string,
  pdfBytes: Uint8Array,
): Promise<string | null> {
  const { error: uploadErr } = await supabase.storage
    .from('contracts')
    .upload(`${contractId}.pdf`, pdfBytes, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) {
    console.error('[sign-pdf] upload failed:', uploadErr)
    return null
  }

  const { data: signed } = await supabase.storage
    .from('contracts')
    .createSignedUrl(`${contractId}.pdf`, 7 * 24 * 60 * 60)

  return signed?.signedUrl ?? null
}

async function tryDocxPath(
  supabase: SupabaseClient,
  template: TemplateRow,
  contract: ContractLike,
  meta: SignedPdfMetadata,
): Promise<Uint8Array | null> {
  const convertKey = readConvertApiSecret()
  if (!convertKey) return null
  if (!template.template_docx_url) return null

  try {
    const { data: docxBlob, error: dlErr } = await supabase.storage
      .from('templates')
      .download(template.template_docx_url)
    if (dlErr || !docxBlob) throw new Error(dlErr?.message ?? 'download failed')

    const docxBytes = new Uint8Array(await docxBlob.arrayBuffer())

    const data: Record<string, string> = {}
    const contractData = contract.data ?? {}
    for (const f of template.fields ?? []) {
      data[f.key] = String(contractData[f.key] ?? '')
    }

    const filled = fillTemplate(docxBytes, data)
    const pdfBytes = await convertDocxToPdf(filled, convertKey, `${meta.contractId.slice(0, 8)}.docx`)
    const qr = await buildQr(meta.contractId)
    return await appendSealPage(pdfBytes, {
      contractId: meta.contractId,
      signerPhone: meta.signerPhone,
      signerIp: meta.signerIp,
      signedAt: meta.signedAt,
      sealHash: meta.sealHash,
      qrPngBuffer: qr,
    })
  } catch (err) {
    console.warn('[sign-pdf] docx path failed, falling back:', err)
    return null
  }
}

async function pdfLibPath(
  template: TemplateRow,
  orgName: string,
  contract: ContractLike,
  meta: SignedPdfMetadata,
): Promise<Uint8Array> {
  const fields = template.fields ?? []
  const data = contract.data ?? {}

  const managerFields = fields
    .filter((f) => (f.filled_by ?? 'manager') === 'manager' && data[f.key])
    .map((f) => ({ label: f.label, value: data[f.key] }))

  const clientFields = fields
    .filter((f) => f.filled_by === 'client')
    .map((f) => ({ label: f.label, value: data[f.key] ?? '—' }))

  const qr = await buildQr(meta.contractId)

  return generateSignedContractPdf({
    contractId: meta.contractId,
    orgName,
    templateName: template.name ?? 'Договор',
    managerFields,
    clientFields,
    signerPhone: meta.signerPhone,
    signerIp: meta.signerIp,
    signedAt: meta.signedAt,
    sealHash: meta.sealHash,
    qrPngBuffer: qr,
  })
}

/**
 * Generate the signed PDF for a contract, preferring the layout-preserving
 * docx → ConvertAPI path and falling back to the pdf-lib renderer on any failure.
 * Uploads to the `contracts` bucket and returns a fresh 7-day signed URL.
 */
export async function generateAndStorePdf(
  supabase: SupabaseClient,
  contract: ContractLike,
  meta: SignedPdfMetadata,
): Promise<GenerationResult> {
  const [templateRes, orgRes] = await Promise.all([
    supabase
      .from('templates')
      .select('name, fields, template_docx_url')
      .eq('id', contract.template_id)
      .maybeSingle(),
    supabase.from('organizations').select('name').eq('id', contract.org_id).maybeSingle(),
  ])

  const template = (templateRes.data ?? { name: 'Договор', fields: [], template_docx_url: null }) as TemplateRow
  const orgName = orgRes.data?.name ?? 'Организация'

  let pdfBytes = await tryDocxPath(supabase, template, contract, meta)
  let via: GenerationResult['via'] = 'docx'

  if (!pdfBytes) {
    try {
      pdfBytes = await pdfLibPath(template, orgName, contract, meta)
      via = 'pdf_lib'
    } catch (err) {
      console.error('[sign-pdf] pdf-lib path failed:', err)
      return { pdfUrl: null, via: 'none', error: err instanceof Error ? err.message : 'unknown' }
    }
  }

  const pdfUrl = await uploadAndSign(supabase, meta.contractId, pdfBytes)
  return { pdfUrl, via }
}
