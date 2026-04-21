import { PDFDocument, rgb, PDFFont, PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { NOTO_SANS_LATIN_WOFF_B64, NOTO_SANS_CYRILLIC_WOFF_B64 } from './fonts'

type Field = { label: string; value: string }

export type GeneratePdfParams = {
  contractId: string
  orgName: string
  templateName: string
  managerFields: Field[]
  clientFields: Field[]
  signerPhone: string
  signerIp: string | null
  signedAt: string
  sealHash: string
  qrPngBuffer: Buffer | Uint8Array
}

export type AppendSealParams = {
  contractId: string
  signerPhone: string
  signerIp: string | null
  signedAt: string
  sealHash: string
  qrPngBuffer: Buffer | Uint8Array
}

export type AppendSummaryParams = {
  orgName: string
  templateName: string
  contractId: string
  managerFields: Field[]
  clientFields: Field[]
}

// Split text into Latin/Cyrillic segments for dual-font rendering
function splitByScript(text: string): Array<{ text: string; isCyrillic: boolean }> {
  const segs: Array<{ text: string; isCyrillic: boolean }> = []
  if (!text) return segs
  let cur = ''
  let isCyr = /[\u0400-\u04FF\u2116]/.test(text[0])
  for (const ch of text) {
    const c = /[\u0400-\u04FF\u2116]/.test(ch)
    if (cur && c !== isCyr) { segs.push({ text: cur, isCyrillic: isCyr }); cur = '' }
    isCyr = c
    cur += ch
  }
  if (cur) segs.push({ text: cur, isCyrillic: isCyr })
  return segs
}

function safeWidth(f: PDFFont, t: string, sz: number): number {
  try { return f.widthOfTextAtSize(t, sz) } catch { return t.length * sz * 0.52 }
}

function measureMixed(text: string, lf: PDFFont, cf: PDFFont, sz: number): number {
  return splitByScript(text).reduce((acc, s) => acc + safeWidth(s.isCyrillic ? cf : lf, s.text, sz), 0)
}

function drawMixed(
  page: PDFPage,
  text: string,
  lf: PDFFont,
  cf: PDFFont,
  x: number, y: number, sz: number,
  col = rgb(0.051, 0.106, 0.165),
): number {
  let cx = x
  for (const s of splitByScript(text)) {
    const f = s.isCyrillic ? cf : lf
    page.drawText(s.text, { x: cx, y, size: sz, font: f, color: col })
    cx += safeWidth(f, s.text, sz)
  }
  return cx - x
}

function truncate(text: string, maxW: number, lf: PDFFont, cf: PDFFont, sz: number): string {
  if (measureMixed(text, lf, cf, sz) <= maxW) return text
  let r = ''
  for (const ch of text) {
    if (measureMixed(r + ch + '…', lf, cf, sz) > maxW) break
    r += ch
  }
  return r + '…'
}

const MARGIN = 48
const W = 595
const H = 842
const CW = W - MARGIN * 2
const LINE_H = 16
const MUTED  = rgb(0.42, 0.494, 0.573)
const TEXT   = rgb(0.051, 0.106, 0.165)
const NAVY   = rgb(0, 0.035, 0.149)
const BLUE   = rgb(0.059, 0.322, 0.729)
const ICE    = rgb(0.839, 0.902, 0.953)

export async function generateSignedContractPdf(p: GeneratePdfParams): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  const lf = await doc.embedFont(Buffer.from(NOTO_SANS_LATIN_WOFF_B64, 'base64'))
  const cf = await doc.embedFont(Buffer.from(NOTO_SANS_CYRILLIC_WOFF_B64, 'base64'))

  let page: PDFPage = doc.addPage([W, H])
  let y = H - MARGIN

  const newPage = () => { page = doc.addPage([W, H]); y = H - MARGIN }

  const line = (text: string, sz: number, col = TEXT, indent = 0) => {
    if (y < MARGIN + 40) newPage()
    drawMixed(page, text.slice(0, 300), lf, cf, MARGIN + indent, y, sz, col)
    y -= LINE_H * (sz / 10)
  }

  const hline = () => {
    page.drawLine({ start: { x: MARGIN, y }, end: { x: W - MARGIN, y }, thickness: 0.4, color: ICE })
    y -= 8
  }

  const fieldRow = (label: string, value: string) => {
    if (y < MARGIN + 30) newPage()
    const lTrunc = truncate(label, CW * 0.46, lf, cf, 9)
    const vTrunc = truncate(value || '—', CW * 0.5, lf, cf, 9)
    drawMixed(page, lTrunc, lf, cf, MARGIN, y, 9, MUTED)
    drawMixed(page, vTrunc, lf, cf, MARGIN + CW * 0.5, y, 9, TEXT)
    page.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: W - MARGIN, y: y - 4 }, thickness: 0.25, color: ICE })
    y -= LINE_H
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  const orgTrunc = truncate(p.orgName, CW - 110, lf, cf, 14)
  drawMixed(page, orgTrunc, lf, cf, MARGIN, y, 14, NAVY)

  const badge = 'Защищено SHA-256'
  const bW = measureMixed(badge, lf, cf, 8) + 16
  page.drawRectangle({ x: W - MARGIN - bW, y: y - 3, width: bW, height: 16, color: ICE })
  drawMixed(page, badge, lf, cf, W - MARGIN - bW + 8, y + 1, 8, BLUE)
  y -= 18

  const subLine = truncate(`Договор №${p.contractId.slice(0, 8).toUpperCase()} · ${p.templateName}`, CW, lf, cf, 9)
  drawMixed(page, subLine, lf, cf, MARGIN, y, 9, MUTED)
  y -= 14

  hline()
  y -= 2

  // ── Manager fields ──────────────────────────────────────────────────────────
  if (p.managerFields.length > 0) {
    line('УСЛОВИЯ ДОГОВОРА', 8, MUTED)
    y -= 2
    for (const f of p.managerFields) fieldRow(f.label, f.value)
    y -= 6; hline(); y -= 2
  }

  // ── Client fields ───────────────────────────────────────────────────────────
  if (p.clientFields.length > 0) {
    line('ДАННЫЕ ЗАКАЗЧИКА', 8, MUTED)
    y -= 2
    for (const f of p.clientFields) fieldRow(f.label, f.value)
    y -= 6; hline(); y -= 2
  }

  // ── Signature ───────────────────────────────────────────────────────────────
  line('ПОДПИСЬ', 8, MUTED)
  y -= 2

  // Mask phone
  const maskedPhone = p.signerPhone
    ? p.signerPhone.replace(/(\+\d)(\d+)(\d{4})$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '—'

  fieldRow('Метод подписания', 'SMS OTP (ПЭП по ст.152 ГК РК)')
  fieldRow('Телефон', maskedPhone)
  fieldRow('Дата подписания', new Date(p.signedAt).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty',
  }))
  if (p.signerIp) fieldRow('IP адрес', p.signerIp)

  y -= 12

  // ── QR + Seal ───────────────────────────────────────────────────────────────
  if (y < MARGIN + 110) newPage()

  const qrSz = 90
  const qrY = y - qrSz
  const qrImg = await doc.embedPng(p.qrPngBuffer)
  page.drawImage(qrImg, { x: MARGIN, y: qrY, width: qrSz, height: qrSz })

  const tx = MARGIN + qrSz + 14
  const lh = (n: number) => qrY + qrSz - n * 13

  drawMixed(page, 'Печать (HMAC-SHA256):', lf, cf, tx, lh(0), 8, MUTED)
  drawMixed(page, p.sealHash.slice(0, 32), lf, cf, tx, lh(1), 7, TEXT)
  drawMixed(page, p.sealHash.slice(32),    lf, cf, tx, lh(2), 7, TEXT)
  drawMixed(page, 'Проверить подпись:', lf, cf, tx, lh(3.5), 8, MUTED)
  drawMixed(page, `onecontract.kz/verify/${p.contractId}`, lf, cf, tx, lh(4.5), 7.5, BLUE)

  y = qrY - 16
  hline()
  y -= 4

  // ── Footer ───────────────────────────────────────────────────────────────────
  line('Подписано в соответствии со ст.152 ГК РК (простая электронная подпись — ПЭП)', 7.5, MUTED)
  line('Документ сформирован автоматически. Юридически значимо без NCALayer/ЭЦП.', 7.5, MUTED)

  return doc.save()
}

/**
 * Append a dedicated seal page to an existing PDF (produced by ConvertAPI from the
 * layout-preserving docx flow). Contains HMAC-SHA256 hash, QR, verify URL, signing
 * metadata, and the ПЭП legal reference.
 */
export async function appendSealPage(
  pdfBytes: Uint8Array,
  p: AppendSealParams,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)
  doc.registerFontkit(fontkit)

  const lf = await doc.embedFont(Buffer.from(NOTO_SANS_LATIN_WOFF_B64, 'base64'))
  const cf = await doc.embedFont(Buffer.from(NOTO_SANS_CYRILLIC_WOFF_B64, 'base64'))

  const page = doc.addPage([W, H])
  let y = H - MARGIN

  const maskedPhone = p.signerPhone
    ? p.signerPhone.replace(/(\+\d)(\d+)(\d{4})$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '—'

  // Header
  drawMixed(page, 'Печать подписи', lf, cf, MARGIN, y, 16, NAVY)
  const badge = 'SHA-256 ПЭП'
  const bW = measureMixed(badge, lf, cf, 8) + 16
  page.drawRectangle({ x: W - MARGIN - bW, y: y - 3, width: bW, height: 16, color: ICE })
  drawMixed(page, badge, lf, cf, W - MARGIN - bW + 8, y + 1, 8, BLUE)
  y -= 22

  const sub = truncate(`Договор №${p.contractId.slice(0, 8).toUpperCase()}`, CW, lf, cf, 10)
  drawMixed(page, sub, lf, cf, MARGIN, y, 10, MUTED)
  y -= 18

  page.drawLine({ start: { x: MARGIN, y }, end: { x: W - MARGIN, y }, thickness: 0.5, color: ICE })
  y -= 20

  // Metadata block
  const row = (label: string, value: string) => {
    drawMixed(page, label, lf, cf, MARGIN, y, 10, MUTED)
    drawMixed(page, truncate(value, CW * 0.6, lf, cf, 10), lf, cf, MARGIN + CW * 0.35, y, 10, TEXT)
    y -= 22
  }

  row('Метод подписания', 'SMS OTP (ПЭП, ст.152 ГК РК)')
  row('Телефон подписанта', maskedPhone)
  row('Дата подписания', new Date(p.signedAt).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty',
  }))
  if (p.signerIp) row('IP адрес', p.signerIp)

  y -= 10
  page.drawLine({ start: { x: MARGIN, y }, end: { x: W - MARGIN, y }, thickness: 0.5, color: ICE })
  y -= 24

  // QR + hash block
  const qrSz = 140
  const qrY = y - qrSz
  const qrImg = await doc.embedPng(p.qrPngBuffer)
  page.drawImage(qrImg, { x: MARGIN, y: qrY, width: qrSz, height: qrSz })

  const tx = MARGIN + qrSz + 20
  drawMixed(page, 'HMAC-SHA256 печать:', lf, cf, tx, y - 14, 10, MUTED)
  drawMixed(page, p.sealHash.slice(0, 32), lf, cf, tx, y - 30, 8, TEXT)
  drawMixed(page, p.sealHash.slice(32), lf, cf, tx, y - 42, 8, TEXT)

  drawMixed(page, 'Проверить подпись:', lf, cf, tx, y - 64, 10, MUTED)
  drawMixed(page, `onecontract.kz/verify/${p.contractId}`, lf, cf, tx, y - 80, 9, BLUE)

  y = qrY - 16
  page.drawLine({ start: { x: MARGIN, y }, end: { x: W - MARGIN, y }, thickness: 0.5, color: ICE })
  y -= 20

  // Footer (wrapped)
  drawMixed(page, 'Документ подписан простой электронной подписью (ПЭП) в соответствии со ст.152 ГК РК.', lf, cf, MARGIN, y, 9, MUTED)
  y -= 14
  drawMixed(page, 'Сформирован автоматически. Юридически значимо без NCALayer/ЭЦП.', lf, cf, MARGIN, y, 9, MUTED)

  return doc.save()
}

/**
 * Append a summary page listing filled contract fields (manager + client).
 * Useful as a middle page between the original document and the seal page —
 * provides a clean, machine-readable record of the data submitted, even if
 * placeholder substitution in the original document was imperfect.
 */
export async function appendSummaryPage(
  pdfBytes: Uint8Array,
  p: AppendSummaryParams,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)
  doc.registerFontkit(fontkit)

  const lf = await doc.embedFont(Buffer.from(NOTO_SANS_LATIN_WOFF_B64, 'base64'))
  const cf = await doc.embedFont(Buffer.from(NOTO_SANS_CYRILLIC_WOFF_B64, 'base64'))

  let page = doc.addPage([W, H])
  let y = H - MARGIN

  const newPage = () => { page = doc.addPage([W, H]); y = H - MARGIN }

  const line = (text: string, sz: number, col = TEXT, indent = 0) => {
    if (y < MARGIN + 40) newPage()
    drawMixed(page, text.slice(0, 300), lf, cf, MARGIN + indent, y, sz, col)
    y -= LINE_H * (sz / 10)
  }

  const hline = () => {
    page.drawLine({ start: { x: MARGIN, y }, end: { x: W - MARGIN, y }, thickness: 0.4, color: ICE })
    y -= 8
  }

  const fieldRow = (label: string, value: string) => {
    if (y < MARGIN + 30) newPage()
    const lTrunc = truncate(label, CW * 0.46, lf, cf, 9)
    const vTrunc = truncate(value || '—', CW * 0.5, lf, cf, 9)
    drawMixed(page, lTrunc, lf, cf, MARGIN, y, 9, MUTED)
    drawMixed(page, vTrunc, lf, cf, MARGIN + CW * 0.5, y, 9, TEXT)
    page.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: W - MARGIN, y: y - 4 }, thickness: 0.25, color: ICE })
    y -= LINE_H
  }

  // Header
  const orgTrunc = truncate(p.orgName, CW - 80, lf, cf, 14)
  drawMixed(page, orgTrunc, lf, cf, MARGIN, y, 14, NAVY)
  y -= 18

  const subLine = truncate(`Сводка данных · Договор №${p.contractId.slice(0, 8).toUpperCase()}`, CW, lf, cf, 9)
  drawMixed(page, subLine, lf, cf, MARGIN, y, 9, MUTED)
  y -= 14

  hline()
  y -= 2

  if (p.managerFields.length > 0) {
    line('УСЛОВИЯ ДОГОВОРА', 8, MUTED)
    y -= 2
    for (const f of p.managerFields) fieldRow(f.label, f.value)
    y -= 6; hline(); y -= 2
  }

  if (p.clientFields.length > 0) {
    line('ДАННЫЕ ЗАКАЗЧИКА', 8, MUTED)
    y -= 2
    for (const f of p.clientFields) fieldRow(f.label, f.value)
  }

  return doc.save()
}
