'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, XCircle, FileText, Shield, Download, Share2 } from 'lucide-react'
import { BoxLoader } from '@/components/ui/BoxLoader'

type VerifyData = {
  id: string
  status: string
  signed_at: string | null
  created_at: string
  recipient_name: string | null
  template_name: string
  org_name: string
  sign_method: string
  pdf_url: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VerifyPage() {
  const { contractId } = useParams<{ contractId: string }>()
  const [data, setData] = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    fetch(`/api/verify/${contractId}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => { if (d) setData(d) })
      .catch(() => setNotFound(true))
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [contractId])

  const handleShare = async () => {
    if (!data) return
    const shareUrl = data.pdf_url ?? `${window.location.origin}/verify/${contractId}`
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Подписанный договор',
          text: data.pdf_url ? 'Подписанный договор (PDF)' : 'Проверка подписи договора',
          url: shareUrl,
        })
        return
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#D6E6F3] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0F52BA] rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="font-bold text-base text-[#0D1B2A]">OneContract</span>
        </div>
      </header>

      <div className="flex-1 px-4 py-8 max-w-md mx-auto w-full">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <BoxLoader />
          </div>
        )}

        {!loading && (notFound || !data) && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-lg font-bold text-[#0D1B2A] mb-2">Договор не найден</h1>
            <p className="text-sm text-[#6B7E92]">Ссылка недействительна или договор был удалён</p>
          </div>
        )}

        {!loading && data && data.status !== 'signed' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-amber-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-lg font-bold text-[#0D1B2A] mb-2">Договор ещё не подписан</h1>
            <p className="text-sm text-[#6B7E92]">Статус: {data.status}</p>
          </div>
        )}

        {!loading && data && data.status === 'signed' && (
          <div className="space-y-5">
            {/* Success icon */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0F7B55]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={36} className="text-[#0F7B55]" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-bold text-[#0D1B2A]">Документ верифицирован</h1>
              <p className="text-sm text-[#6B7E92] mt-1">Подпись подлинна и действительна</p>
            </div>

            {/* Contract details card */}
            <div className="bg-white border border-[#D6E6F3] rounded-2xl p-5 shadow-sm space-y-3">
              {[
                { label: 'Организация', value: data.org_name },
                { label: 'Тип договора', value: data.template_name },
                { label: 'Подписант', value: data.recipient_name ?? '—' },
                { label: 'Дата подписания', value: formatDate(data.signed_at) },
                { label: 'Метод подписания', value: 'SMS OTP (ПЭП)' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-[#6B7E92] shrink-0">{label}</span>
                  <span className="text-sm font-medium text-[#0D1B2A] text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {data.pdf_url && (
                <a
                  href={data.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`contract-${contractId.slice(0, 8)}.pdf`}
                  className="w-full h-12 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={16} strokeWidth={1.5} />
                  Скачать PDF
                </a>
              )}
              <button
                onClick={handleShare}
                className="w-full h-12 border border-[#A6C5D7] text-[#0D1B2A] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#D6E6F3]/20 transition-colors"
              >
                <Share2 size={16} strokeWidth={1.5} />
                {linkCopied ? 'Ссылка скопирована!' : 'Поделиться'}
              </button>
            </div>

            {/* Legal note */}
            <div className="bg-[#D6E6F3]/40 rounded-2xl px-4 py-3 flex items-start gap-2">
              <Shield size={14} className="text-[#0F52BA] mt-0.5 shrink-0" strokeWidth={1.5} />
              <p className="text-xs text-[#6B7E92] leading-relaxed">
                Подписано электронно через OneContract. Юридически значимо по ст.152 ГК РК и Закону РК №370-II (ПЭП).
              </p>
            </div>

            <p className="text-center text-[10px] text-[#A6C5D7]">
              onecontract.kz/verify/{contractId.slice(0, 8)}...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
