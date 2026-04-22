'use client'

import { useState, useEffect } from 'react'
import { Expand, X, FileText, ExternalLink } from 'lucide-react'
import { BoxLoader } from '@/components/ui/BoxLoader'

interface DocumentPreviewProps {
  file: File | null
  fileUrl: string | null
  fileKind: 'pdf' | 'docx' | null
}

export function DocumentPreview({ file, fileUrl, fileKind }: DocumentPreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(true)

  const viewerUrl = (() => {
    if (!fileUrl) return null
    if (fileKind === 'docx') {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
    }
    return `${fileUrl}#toolbar=0&navpanes=0`
  })()

  useEffect(() => {
    setIframeLoading(true)
  }, [fileUrl])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  const fileName = file?.name ?? (fileKind === 'docx' ? 'Документ.docx' : 'Документ.pdf')

  const iframeContent = (
    <div className="relative bg-white w-full h-full" style={{ minHeight: 400 }}>
      {iframeLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
          <BoxLoader />
          <p className="text-xs text-[#6B7E92]">Загрузка документа...</p>
        </div>
      )}
      {viewerUrl ? (
        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          onLoad={() => setIframeLoading(false)}
          title="Предпросмотр документа"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
          <FileText size={32} strokeWidth={1.5} className="text-[#A6C5D7]" />
          <p className="text-sm text-[#6B7E92]">Загрузите документ для предпросмотра</p>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="bg-white border border-[#D6E6F3] rounded-2xl shadow-sm flex flex-col overflow-hidden h-[50vh] lg:h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8FAFC] border-b border-[#D6E6F3] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={14} strokeWidth={1.5} className="text-[#0F52BA] shrink-0" />
            <span className="text-xs font-medium text-[#0D1B2A] truncate">{fileName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0F52BA] hover:underline flex items-center gap-1"
              >
                <ExternalLink size={11} strokeWidth={1.5} />
                Скачать
              </a>
            )}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="p-1.5 hover:bg-[#D6E6F3]/50 rounded-lg transition-colors"
              title="Развернуть"
            >
              <Expand size={14} strokeWidth={1.5} className="text-[#6B7E92]" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {iframeContent}
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-label="Превью договора на весь экран"
        >
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#D6E6F3] shrink-0">
              <span className="text-sm font-semibold text-[#0D1B2A] truncate">{fileName}</span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Закрыть (Esc)"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {iframeContent}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
