import QRCode from 'qrcode'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateSignedContractPdf, addSignatureFooter, addWatermark } from './pdf'
import { fillTemplate } from './docx'
import { convertDocxToPdf, readConvertApiSecret } from './convertapi'
import { ensureSignedPdfUrl } from './pdf-cache'
import { tryOriginalPdfPath } from './source-pdf'

export type SignedPdfMetadata = {
  contractId: string
  signerPhone: string
  signerIp: string | null
  signedAt: string
  sealHash: string
}

export type GenerationResult = {
  pdfUrl: string | null
  via: 'cached' | 'docx' | 'source_pdf' | 'pdf_lib_fallback' | 'none'
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
  source_file_url?: string | null
}

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

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
    .createSignedUrl(`${contractId}.pdf`, ONE_YEAR_SECONDS)

  return signed?.signedUrl ?? null
}

async function tryDocxPath(
  supabase: SupabaseClient,
  template: TemplateRow,
  contract: ContractLike,
  meta: SignedPdfMetadata,
): Promise<Uint8Array | null> {
  const convertKey = readConvertApiSecret()
  if (!convertKey) {
    console.warn('[docx-path] SKIP: CONVERTAPI_SECRET not set')
    return null
  }
  if (!template.template_docx_url) {
    console.warn('[docx-path] SKIP: template has no normalized DOCX (template_docx_url is null)')
    console.warn('[docx-path] template fields:', template.fields?.length ?? 0, 'source_file_url:', template.source_file_url)
    return null
  }
  console.log('[docx-path] convertKey present: true, template_docx_url:', template.template_docx_url)

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

    console.log('[docx-path] filling', Object.keys(data).length, 'fields:', Object.keys(data).join(', '))
    const filled = fillTemplate(docxBytes, data)
    return await convertDocxToPdf(filled, convertKey, `${meta.contractId.slice(0, 8)}.docx`)
  } catch (err) {
    console.warn('[sign-pdf] docx path failed:', err)
    return null
  }
}

function buildSummaryFields(
  template: TemplateRow,
  contract: ContractLike,
): { managerFields: { label: string; value: string }[]; clientFields: { label: string; value: string }[] } {
  const fields = template.fields ?? []
  const data = contract.data ?? {}

  const managerFields = fields
    .filter((f) => (f.filled_by ?? 'manager') === 'manager' && data[f.key])
    .map((f) => ({ label: f.label, value: data[f.key] }))

  const clientFields = fields
    .filter((f) => f.filled_by === 'client')
    .map((f) => ({ label: f.label, value: data[f.key] ?? '—' }))

  return { managerFields, clientFields }
}

async function summaryOnlyFallback(
  template: TemplateRow,
  orgName: string,
  contract: ContractLike,
  meta: SignedPdfMetadata,
): Promise<Uint8Array> {
  const { managerFields, clientFields } = buildSummaryFields(template, contract)
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
 * Generate the signed PDF for a contract:
 *   1. Cache: return existing signed PDF if already in storage
 *   2. DOCX path: fill {{placeholders}} → ConvertAPI → PDF with data inside
 *   3. Source PDF fallback: original file + QR seal footer (data NOT inserted)
 *   4. Last-resort: summary-only pdf-lib render (no original layout)
 *
 * NOTE: Summary pages are added ONLY in path 4 (last resort).
 * Paths 2 and 3 add only a QR seal footer at bottom of last page.
 */
export async function generateAndStorePdf(
  supabase: SupabaseClient,
  contract: ContractLike,
  meta: SignedPdfMetadata,
): Promise<GenerationResult> {
  // 1. Cache check — don't regenerate if already produced
  const cached = await ensureSignedPdfUrl(supabase, meta.contractId)
  if (cached) return { pdfUrl: cached, via: 'cached' }

  const [templateRes, orgRes] = await Promise.all([
    supabase
      .from('templates')
      .select('*')
      .eq('id', contract.template_id)
      .maybeSingle(),
    supabase.from('organizations').select('name').eq('id', contract.org_id).maybeSingle(),
  ])

  const template = (templateRes.data ?? { name: 'Договор', fields: [], template_docx_url: null, source_file_url: null }) as TemplateRow
  const orgName = orgRes.data?.name ?? 'Организация'

  let basePdf: Uint8Array | null = null
  let via: GenerationResult['via'] = 'none'

  // 2. DOCX filled path
  basePdf = await tryDocxPath(supabase, template, contract, meta)
  if (basePdf) via = 'docx'

  // 3. Original-source fallback (docx-as-is or raw pdf)
  if (!basePdf) {
    basePdf = await tryOriginalPdfPath(supabase, template.source_file_url ?? null)
    if (basePdf) via = 'source_pdf'
  }

  if (via === 'source_pdf') {
    console.warn('[sign-pdf] WARNING: Using source_pdf fallback — data NOT inserted into document')
    console.warn('[sign-pdf] Client will see original document without filled fields')
    console.warn('[sign-pdf] Fix: ensure template has template_docx_url and CONVERTAPI_SECRET is set')
  }
  console.log('[sign-pdf] generating via:', via)

  let finalPdf: Uint8Array
  try {
    if (basePdf) {
      const qr = await buildQr(meta.contractId)
      finalPdf = await addSignatureFooter(basePdf, {
        qrBuffer: qr,
        sealHash: meta.sealHash,
        contractId: meta.contractId,
        signedAt: meta.signedAt,
      })
    } else {
      // 4. Last-resort: summary-only pdf-lib render (already contains all data + QR inline)
      finalPdf = await summaryOnlyFallback(template, orgName, contract, meta)
      via = 'pdf_lib_fallback'
    }
  } catch (err) {
    console.error('[sign-pdf] assembly failed:', err)
    return { pdfUrl: null, via: 'none', error: err instanceof Error ? err.message : 'unknown' }
  }

  try {
    finalPdf = await addWatermark(finalPdf)
  } catch (e) {
    console.warn('[sign-pdf] watermark failed (non-fatal):', e)
  }

  const pdfUrl = await uploadAndSign(supabase, meta.contractId, finalPdf)
  if (!pdfUrl) return { pdfUrl: null, via: 'none', error: 'upload failed' }

  console.log('[sign-pdf] generated via:', via, 'basePdf:', !!basePdf, 'contractId:', meta.contractId)
  return { pdfUrl, via }
}
