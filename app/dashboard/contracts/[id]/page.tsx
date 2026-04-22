'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Mail, Copy, Check, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import type { ContractStatus } from '@/lib/dashboard/types'
import type { TemplateField } from '@/lib/types'

type ContractDetail = {
  id: string
  template_id: string | null
  status: ContractStatus
  sent_via: 'sms' | 'email' | null
  recipient_name: string | null
  recipient_phone: string | null
  recipient_email: string | null
  data: Record<string, string>
  created_at: string
  sent_at: string | null
  templates: { name: string; fields: TemplateField[] } | null
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [pdfVia, setPdfVia] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sendingSms, setSendingSms] = useState(false)
  const [smsResult, setSmsResult] = useState<'success' | 'error' | null>(null)
  const [smsError, setSmsError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else {
          setContract(d.contract)
          setPdfVia(d.pdfVia ?? null)
        }
      })
      .catch(() => setError('Не удалось загрузить договор'))
      .finally(() => setLoading(false))
  }, [id])

  const title = contract?.templates?.name ?? 'Договор'
  const ChannelIcon = contract?.sent_via === 'sms' ? MessageSquare : Mail

  const signingUrl =
    typeof window !== 'undefined' && contract
      ? `${window.location.origin}/sign/${contract.id}`
      : contract ? `/sign/${contract.id}` : ''

  const handleCopyLink = async () => {
    if (!contract) return
    const orgName = 'OneContract'
    const text = `${orgName} отправил вам договор на подписание.\nПодпишите по ссылке: ${signingUrl}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendSms = async () => {
    if (!contract || sendingSms) return
    setSendingSms(true)
    setSmsResult(null)
    setSmsError(null)
    try {
      const res = await fetch(`/api/contracts/${contract.id}/send-sms`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Ошибка')
      setSmsResult('success')
      setContract((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'draft' ? ('sent' as ContractStatus) : prev.status,
              sent_via: 'sms',
            }
          : prev
      )
      setTimeout(() => setSmsResult(null), 3000)
    } catch (e: unknown) {
      setSmsResult('error')
      setSmsError(e instanceof Error ? e.message : 'Ошибка отправки SMS')
    } finally {
      setSendingSms(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text-dark transition-colors mb-3"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          К договорам
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-text-dark tracking-tight">
            {loading ? '…' : title}
          </h1>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {contract && <StatusBadge status={contract.status} />}
            {contract?.status === 'signed' && pdfVia && pdfVia !== 'cached' && (
              pdfVia === 'docx' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                  <CheckCircle2 size={11} strokeWidth={2} />
                  Данные вставлены в документ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                  <AlertTriangle size={11} strokeWidth={2} />
                  Данные не вставлены.{' '}
                  {contract.template_id && (
                    <Link href={`/dashboard/templates/${contract.template_id}/edit`} className="underline">
                      Настройте шаблон
                    </Link>
                  )}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-ice animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {contract && (
        <>
          {/* Recipient */}
          <div className="bg-white border border-ice rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
              Клиент
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-ice flex items-center justify-center flex-shrink-0">
                <ChannelIcon size={16} strokeWidth={1.5} className="text-sapphire" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-dark">
                  {contract.recipient_name ?? '—'}
                </p>
                <p className="text-xs text-muted">
                  {contract.sent_via === 'sms'
                    ? contract.recipient_phone ?? '—'
                    : contract.recipient_email ?? '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}
          {contract.templates?.fields && contract.templates.fields.length > 0 && (
            <div className="bg-white border border-ice rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Данные договора
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {contract.templates.fields.map((f) => (
                  <div key={f.key}>
                    <dt className="text-xs text-muted">{f.label}</dt>
                    <dd className="text-sm font-medium text-text-dark">
                      {contract.data[f.key] || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border border-ice rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
              История
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Создан</span>
                <span className="font-medium text-text-dark">
                  {formatDate(contract.created_at)}
                </span>
              </div>
              {contract.sent_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Отправлен</span>
                  <span className="font-medium text-text-dark">
                    {formatDate(contract.sent_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Signing link */}
          <div className="bg-ice/60 border border-ice rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
              Ссылка для подписания
            </p>
            <p className="text-sm text-muted break-all mb-4">{signingUrl}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 h-11 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <><Check size={16} strokeWidth={2} /> Скопировано</>
                ) : (
                  <><Copy size={16} strokeWidth={1.5} /> Копировать ссылку</>
                )}
              </button>
              <button
                onClick={handleSendSms}
                disabled={sendingSms || contract.status === 'signed'}
                className={`flex-1 h-11 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  smsResult === 'success'
                    ? 'border-green-400 text-green-700 bg-green-50'
                    : smsResult === 'error'
                    ? 'border-red-400 text-red-700 bg-red-50'
                    : 'border-[#A6C5D7] text-[#0D1B2A] hover:bg-[#D6E6F3]/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {sendingSms ? (
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                ) : smsResult === 'success' ? (
                  <><Check size={16} strokeWidth={1.5} /> SMS отправлен</>
                ) : smsResult === 'error' ? (
                  <><MessageSquare size={16} strokeWidth={1.5} /> Не удалось</>
                ) : (
                  <><MessageSquare size={16} strokeWidth={1.5} /> Отправить SMS</>
                )}
              </button>
              <button
                disabled
                title="Скоро"
                className="flex-1 h-11 border border-[#A6C5D7] text-[#6B7E92] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              >
                <Mail size={16} strokeWidth={1.5} /> Отправить Email
              </button>
            </div>
            {smsError && (
              <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
                <AlertTriangle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold mb-0.5">SMS не отправлен</p>
                  <p className="text-red-600">{smsError}</p>
                  <p className="mt-2 text-red-500">
                    Пока не настроено — используйте кнопку «Копировать ссылку» и отправьте через WhatsApp или Telegram.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
