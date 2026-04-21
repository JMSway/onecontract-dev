'use client'

import { useEffect, useState } from 'react'
import { Expand, X, Loader2, FileText } from 'lucide-react'

interface DocumentPreviewProps {
  file: File | null
  fileUrl: string | null
  fileKind: 'pdf' | 'docx' | null
}

export function DocumentPreview({ file, fileUrl, fileKind }: DocumentPreviewProps) {
  const [docxHtml, setDocxHtml] = useState<string>('')
  const [docxLoading, setDocxLoading] = useState(false)
  const [docxError, setDocxError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (fileKind !== 'docx' || !file) return
    let cancelled = false
    setDocxLoading(true)
    setDocxError(null)
    ;(async () => {
      try {
        const mammoth = await import('mammoth/mammoth.browser')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        if (!cancelled) setDocxHtml(result.value)
      } catch (e) {
        if (!cancelled) {
          setDocxError('Не удалось отобразить документ')
          console.error('[DocumentPreview] docx render failed:', e)
        }
      } finally {
        if (!cancelled) setDocxLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file, fileKind])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  const renderPreview = (mode: 'inline' | 'full') => {
    const className =
      mode === 'inline'
        ? 'w-full h-full border border-[#D6E6F3] rounded-2xl bg-white'
        : 'w-full h-full bg-white'

    if (fileKind === 'pdf' && fileUrl) {
      return (
        <iframe
          src={fileUrl}
          className={className}
          title="Превью договора"
        />
      )
    }

    if (fileKind === 'docx') {
      if (docxLoading) {
        return (
          <div className={`${className} flex items-center justify-center`}>
            <div className="flex items-center gap-2 text-sm text-[#6B7E92]">
              <Loader2 size={16} className="animate-spin" /> Рендерим документ…
            </div>
          </div>
        )
      }
      if (docxError) {
        return (
          <div className={`${className} flex items-center justify-center p-6 text-center`}>
            <p className="text-sm text-[#6B7E92]">{docxError}</p>
          </div>
        )
      }
      const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><style>
body{font:14px/1.6 Inter,system-ui,sans-serif;padding:24px;color:#0D1B2A;margin:0}
p{margin:0 0 10px}
h1,h2,h3,h4{color:#0D1B2A;margin:16px 0 8px}
table{border-collapse:collapse;margin:8px 0;width:100%}
td,th{border:1px solid #D6E6F3;padding:6px 10px;vertical-align:top;text-align:left}
strong{font-weight:600}
ul,ol{padding-left:20px;margin:0 0 10px}
img{max-width:100%;height:auto}
</style></head><body>${docxHtml}</body></html>`
      return (
        <iframe
          srcDoc={srcDoc}
          sandbox=""
          className={className}
          title="Превью договора"
        />
      )
    }

    return (
      <div className={`${className} flex flex-col items-center justify-center gap-2 p-6 text-center`}>
        <FileText size={32} className="text-[#A6C5D7]" strokeWidth={1.5} />
        <p className="text-sm text-[#6B7E92]">Превью недоступно</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-[#D6E6F3] rounded-2xl shadow-sm flex flex-col overflow-hidden h-[50vh] lg:h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D6E6F3] bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#D6E6F3] flex items-center justify-center shrink-0">
              <FileText size={14} className="text-[#0F52BA]" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-[#0D1B2A] truncate">
              {file?.name ?? 'Превью договора'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="hidden lg:flex items-center gap-1.5 text-xs text-[#6B7E92] hover:text-[#0F52BA] px-2 py-1 rounded-lg hover:bg-[#D6E6F3]/50 transition-colors"
            title="Расширить на весь экран"
          >
            <Expand size={14} strokeWidth={1.5} />
            Расширить
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-1">{renderPreview('inline')}</div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="lg:hidden border-t border-[#D6E6F3] py-3 text-sm font-semibold text-[#0F52BA] hover:bg-[#D6E6F3]/30 transition-colors flex items-center justify-center gap-2"
        >
          <Expand size={16} strokeWidth={1.5} />
          Расширить на весь экран
        </button>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col opacity-100 transition-opacity duration-200"
          role="dialog"
          aria-label="Превью договора на весь экран"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D6E6F3] bg-white">
            <p className="text-sm font-semibold text-[#0D1B2A] truncate">
              {file?.name ?? 'Превью договора'}
            </p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="p-1.5 rounded-lg hover:bg-[#D6E6F3]/50 transition-colors"
              title="Закрыть (Esc)"
            >
              <X size={20} className="text-[#6B7E92]" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-2 sm:p-4">{renderPreview('full')}</div>
        </div>
      )}
    </>
  )
}

