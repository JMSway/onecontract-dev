import { getCloudflareContext } from '@opennextjs/cloudflare'

export function readMobizonKey(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env?.MOBIZON_API_KEY) return env.MOBIZON_API_KEY
  } catch {
    // not running inside Cloudflare runtime (e.g. `next dev`) — fall through
  }
  return process.env.MOBIZON_API_KEY
}

export function readMobizonSender(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env?.MOBIZON_SENDER_NAME) return env.MOBIZON_SENDER_NAME
  } catch {}
  return process.env.MOBIZON_SENDER_NAME
}

export type MobizonSendResult =
  | { ok: true }
  | { ok: false; error: string; code: number | null; raw: unknown }

export async function sendSms(recipient: string, text: string): Promise<MobizonSendResult> {
  const apiKey = readMobizonKey()
  if (!apiKey) {
    return { ok: false, error: 'MOBIZON_API_KEY не настроен', code: null, raw: null }
  }

  const cleanRecipient = recipient.replace(/^\+/, '').replace(/\D/g, '')
  if (!cleanRecipient) {
    return { ok: false, error: 'Неверный формат номера', code: null, raw: null }
  }

  const sender = readMobizonSender()
  const payload: Record<string, string> = { recipient: cleanRecipient, text }
  if (sender) payload.from = sender

  const url = `https://api.mobizon.kz/service/message/sendSmsMessage?output=json&apiKey=${apiKey}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await res.json().catch(() => null)) as
      | { code?: number; message?: string; data?: unknown }
      | null

    console.log('[mobizon] sendSms status:', res.status, 'code:', data?.code, 'message:', data?.message, 'sender:', sender ?? '(default)')

    if (!data) {
      return { ok: false, error: `HTTP ${res.status}: неверный ответ Mobizon`, code: null, raw: null }
    }

    if (data.code !== 0) {
      const msg = humanizeMobizonError(data.code ?? null, data.message)
      return { ok: false, error: msg, code: data.code ?? null, raw: data }
    }

    return { ok: true }
  } catch (e) {
    console.error('[mobizon] sendSms threw:', e)
    return { ok: false, error: 'Сеть не отвечает', code: null, raw: null }
  }
}

function humanizeMobizonError(code: number | null, originalMessage?: string): string {
  const base = originalMessage?.trim() || 'Неизвестная ошибка Mobizon'
  switch (code) {
    case 1:
      return `${base}. Проверьте правильность номера.`
    case 10:
    case 11:
      return `${base}. Требуется одобренный отправитель: Mobizon → SMS → Отправители SMS → создать и промодерировать имя отправителя, затем добавить MOBIZON_SENDER_NAME в Cloudflare Workers.`
    case 15:
      return `${base}. Номер в стоп-листе у оператора.`
    case 21:
      return `${base}. Недостаточно средств на счёте Mobizon — пополните баланс.`
    default:
      return base
  }
}
