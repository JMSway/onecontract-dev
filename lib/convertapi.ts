import { getCloudflareContext } from '@opennextjs/cloudflare'

export function readConvertApiSecret(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env?.CONVERTAPI_SECRET) return env.CONVERTAPI_SECRET
  } catch {
    // not in Cloudflare runtime — fall through
  }
  return process.env.CONVERTAPI_SECRET
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function convertDocxToPdf(
  docxBytes: Uint8Array,
  apiKey: string,
  filename = 'contract.docx',
): Promise<Uint8Array> {
  const form = new FormData()
  const blob = new Blob([new Uint8Array(docxBytes)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  form.append('File', blob, filename)
  form.append('StoreFile', 'false')

  const res = await fetch(
    `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${encodeURIComponent(apiKey)}`,
    { method: 'POST', body: form },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`ConvertAPI ${res.status}: ${text.slice(0, 500)}`)
  }

  const json = (await res.json()) as { Files?: Array<{ FileData?: string }> }
  const b64 = json.Files?.[0]?.FileData
  if (!b64) throw new Error('ConvertAPI returned no FileData')
  return base64ToBytes(b64)
}
