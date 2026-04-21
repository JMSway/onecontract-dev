import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import type { DocxPatch } from './types'

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ENTITIES[c])
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Build regex that tolerates `</w:t></w:r><w:r ...><w:t ...>` sequences between characters.
// Handles the common case where Word splits runs mid-text due to proofing markers.
function looseRegex(search: string): RegExp {
  const chars = Array.from(search).map(escapeRegex)
  // between any two characters of the source, we allow any number of XML tag sequences
  const pattern = chars.join('(?:<[^>]+>)*')
  return new RegExp(pattern, 'u')
}

export interface PatchResult {
  bytes: Uint8Array
  applied: number
  missed: number
}

/**
 * Rewrite `word/document.xml` in the docx by applying AI-generated search→replace patches.
 * Falls back to a loose regex (tolerating XML tags between characters) when direct substring
 * matching fails — common when Word splits text across `<w:r>` runs.
 */
export function applyPatches(docxBytes: ArrayBuffer | Uint8Array, patches: DocxPatch[]): PatchResult {
  const input = docxBytes instanceof Uint8Array ? docxBytes : new Uint8Array(docxBytes)
  const zip = new PizZip(input)
  const entry = zip.file('word/document.xml')
  if (!entry) throw new Error('Invalid docx: word/document.xml missing')

  let xml = entry.asText()
  let applied = 0
  let missed = 0

  for (const p of patches) {
    const searchRaw = p.search
    const replaceXml = escapeXml(p.replace)

    if (xml.includes(searchRaw)) {
      xml = xml.split(searchRaw).join(replaceXml)
      applied++
      continue
    }

    const searchXml = escapeXml(searchRaw)
    if (xml.includes(searchXml)) {
      xml = xml.split(searchXml).join(replaceXml)
      applied++
      continue
    }

    try {
      const re = looseRegex(searchXml)
      const m = xml.match(re)
      if (m && m[0]) {
        xml = xml.replace(m[0], replaceXml)
        applied++
        continue
      }
    } catch {
      // invalid regex — skip
    }

    missed++
  }

  zip.file('word/document.xml', xml)
  const bytes = zip.generate({ type: 'uint8array', compression: 'DEFLATE' }) as Uint8Array
  return { bytes, applied, missed }
}

/**
 * Fill a normalized .docx (with `{{placeholder}}` tokens) using docxtemplater.
 * Missing values render as empty strings rather than throwing.
 */
export function fillTemplate(docxBytes: ArrayBuffer | Uint8Array, data: Record<string, string>): Uint8Array {
  const input = docxBytes instanceof Uint8Array ? docxBytes : new Uint8Array(docxBytes)
  const zip = new PizZip(input)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })
  doc.render(data)
  return doc.getZip().generate({ type: 'uint8array', compression: 'DEFLATE' }) as Uint8Array
}
