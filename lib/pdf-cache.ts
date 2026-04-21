import type { SupabaseClient } from '@supabase/supabase-js'

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

/**
 * Return a fresh signed URL for the contract's PDF if the file exists in the
 * `contracts` bucket. Returns null if the file hasn't been generated yet.
 *
 * Used both as a cache check before calling ConvertAPI (skip work if already
 * generated) and as a lazy re-signer on read paths so download links keep
 * working past the signed-URL TTL.
 */
export async function ensureSignedPdfUrl(
  supabase: SupabaseClient,
  contractId: string,
): Promise<string | null> {
  const path = `${contractId}.pdf`

  const { data: list } = await supabase.storage
    .from('contracts')
    .list('', { search: path, limit: 1 })

  if (!list || list.length === 0 || !list.some((f) => f.name === path)) {
    return null
  }

  const { data: signed } = await supabase.storage
    .from('contracts')
    .createSignedUrl(path, ONE_YEAR_SECONDS)

  return signed?.signedUrl ?? null
}
