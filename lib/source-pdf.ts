import type { SupabaseClient } from '@supabase/supabase-js'
import { convertDocxToPdf, readConvertApiSecret } from './convertapi'

/**
 * Extract the storage path from a Supabase signed URL.
 * Format: https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
 */
export function parseStoragePath(signedUrl: string, bucket: string): string | null {
  const marker = `/${bucket}/`
  const idx = signedUrl.indexOf(marker)
  if (idx === -1) return null
  const tail = signedUrl.slice(idx + marker.length)
  const rawPath = tail.split('?')[0]
  if (!rawPath) return null
  try {
    return decodeURIComponent(rawPath)
  } catch {
    return rawPath
  }
}

/**
 * Produce a PDF of the original template (without field substitution) as a last-resort
 * layout-preserving fallback. Used when the DOCX+ConvertAPI+patches path fails (e.g.
 * `template_docx_url` is null on legacy templates, or normalization missed).
 *
 * - DOCX source → ConvertAPI conversion as-is
 * - PDF source → raw bytes
 *
 * Returns null on any failure so callers can fall through to the pdf-lib summary.
 */
export async function tryOriginalPdfPath(
  supabase: SupabaseClient,
  sourceFileUrl: string | null,
): Promise<Uint8Array | null> {
  if (!sourceFileUrl) return null

  const path = parseStoragePath(sourceFileUrl, 'templates')
  if (!path) return null

  try {
    const { data: blob, error } = await supabase.storage.from('templates').download(path)
    if (error || !blob) return null

    const bytes = new Uint8Array(await blob.arrayBuffer())
    const lower = path.toLowerCase()

    if (lower.endsWith('.pdf')) return bytes

    if (lower.endsWith('.docx')) {
      const key = readConvertApiSecret()
      if (!key) return null
      return await convertDocxToPdf(bytes, key, path.split('/').pop() ?? 'original.docx')
    }

    return null
  } catch (err) {
    console.warn('[source-pdf] failed:', err)
    return null
  }
}
