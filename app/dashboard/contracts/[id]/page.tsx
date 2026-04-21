'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Mail } from 'lucide-react'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import type { ContractStatus } from '@/lib/dashboard/types'
import type { TemplateField } from '@/lib/types'

type ContractDetail = {
  id: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setContract(d.contract)
      })
      .catch(() => setError('Не удалось загрузить договор'))
      .finally(() => setLoading(false))
  }, [id])

  const title = contract?.templates?.name ?? 'Договор'
  const ChannelIcon = contract?.sent_via === 'sms' ? MessageSquare : Mail

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
          {contract && <StatusBadge status={contract.status} />}
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
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">
              Ссылка для подписания
            </p>
            <p className="text-sm font-medium text-text-dark break-all">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/sign/${contract.id}`
                : `/sign/${contract.id}`}
            </p>
            <p className="text-xs text-muted mt-1">
              Страница подписания появится в следующем обновлении
            </p>
          </div>
        </>
      )}
    </div>
  )
}
