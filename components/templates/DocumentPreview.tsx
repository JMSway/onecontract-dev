'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Expand, X, FileText, ZoomIn, ZoomOut } from 'lucide-react'
import { BoxLoader } from '@/components/ui/BoxLoader'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

interface DocumentPreviewProps {
  file: File | null
  fileUrl: string | null
  fileKind: 'pdf' | 'docx' | null
}

const PDF_OPTIONS = {
  cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/standard_fonts/`,
}

export function DocumentPreview({ file, fileUrl, fileKind }: DocumentPreviewProps) {
  const [docxHtml, setDocxHtml] = useState<string>('')
  const [docxLoading, setDocxLoading] = useState(false)
  const [docxError, setDocxError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const [numPages, setNumPages] = useState<number>(0)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [zoom, setZoom] = useState(1)

  const inlineContainerRef = useRef<HTMLDivElement | null>(null)
  const fullContainerRef = useRef<HTMLDivElement | null>(null)
  const [inlineWidth, setInlineWidth] = useState(0)
  const [fullWidth, setFullWidth] = useState(0)

  const pdfSource = useMemo(() => file ?? fileUrl, [file, fileUrl])

  useEffect(() => {
    if (fileKind !== 'docx') return
    if (!file && !fileUrl) return
    let cancelled = false
    setDocxLoading(true)
    setDocxError(null)
    ;(async () => {
      try {
        const mammoth = await import('mammoth/mammoth.browser')
        const arrayBuffer = file
          ? await file.arrayBuffer()
          : await (await fetch(fileUrl!)).arrayBuffer()
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
  }, [file, fileUrl, fileKind])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  useEffect(() => {
    const target = inlineContainerRef.current
    if (!target) return
    const update = () => setInlineWidth(target.clientWidth)
    update()
    const obs = new ResizeObserver(update)
    obs.observe(target)
    return () => obs.disconnect()
  }, [fileKind])

  useEffect(() => {
    if (!expanded) return
    const target = fullContainerRef.current
    if (!target) return
    const update = () => setFullWidth(target.clientWidth)
    update()
    const obs = new ResizeObserver(update)
    obs.observe(target)
    return () => obs.disconnect()
  }, [expanded])

  const handleLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setPdfLoading(false)
    setPdfError(null)
  }, [])

  const handleLoadError = useCallback((err: Error) => {
    console.error('[DocumentPreview] pdf load error:', err)
    setPdfError('Не удалось загрузить PDF')
    setPdfLoading(false)
  }, [])

  const handleLoadStart = useCallback(() => {
    setPdfLoading(true)
    setPdfError(null)
  }, [])

  const renderPdf = (containerWidth: number, mode: 'inline' | 'full') => {
    if (!pdfSource) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-[#6B7E92]">Файл недоступен</p>
        </div>
      )
    }

    const basePageWidth = Math.max(containerWidth - (mode === 'full' ? 32 : 16), 240)
    const pageWidth = Math.round(basePageWidth * (mode === 'full' ? zoom : 1))

    return (
      <div className="w-full h-full overflow-auto bg-[#F1F5F9] py-4 flex flex-col items-center">
        <Document
          file={pdfSource}
          options={PDF_OPTIONS}
          onLoadStart={handleLoadStart}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={
            <div className="flex items-center justify-center py-16">
              <BoxLoader />
            </div>
          }
          error={
            <div className="px-6 py-10 text-center">
              <FileText size={28} className="text-[#A6C5D7] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-[#6B7E92] mb-3">
                {pdfError ?? 'Не удалось отобразить PDF'}
              </p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0F52BA] hover:underline font-medium"
                >
                  Открыть в новой вкладке
                </a>
              )}
            </div>
          }
          className="flex flex-col items-center gap-3"
        >
          {!pdfLoading && !pdfError &&
            Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-[0_2px_8px_rgba(13,27,42,0.08)] bg-white"
              />
            ))}
        </Document>
      </div>
    )
  }

  const renderDocx = () => {
    if (docxLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <BoxLoader />
        </div>
      )
    }
    if (docxError) {
      return (
        <div className="flex items-center justify-center p-6 text-center h-full">
          <p className="text-sm text-[#6B7E92]">{docxError}</p>
        </div>
      )
    }
    const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><style>
body{font:14px/1.7 Inter,system-ui,sans-serif;padding:32px 40px;color:#0D1B2A;margin:0;background:#fff;max-width:780px;margin:0 auto}
p{margin:0 0 12px}
h1,h2,h3,h4{color:#0D1B2A;margin:20px 0 10px;font-weight:600}
h1{font-size:20px}
h2{font-size:17px}
h3{font-size:15px}
table{border-collapse:collapse;margin:10px 0;width:100%}
td,th{border:1px solid #D6E6F3;padding:8px 12px;vertical-align:top;text-align:left;white-space:pre-wrap}
strong{font-weight:600}
ul,ol{padding-left:22px;margin:0 0 12px}
li{margin-bottom:4px}
img{max-width:100%;height:auto}
</style></head><body>${docxHtml}</body></html>`
    return (
      <iframe
        srcDoc={srcDoc}
        sandbox=""
        className="w-full h-full bg-white border-0"
        title="Превью договора"
      />
    )
  }

  const renderPreview = (mode: 'inline' | 'full') => {
    if (fileKind === 'pdf') {
      return renderPdf(mode === 'full' ? fullWidth : inlineWidth, mode)
    }
    if (fileKind === 'docx') {
      return renderDocx()
    }
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center h-full">
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
            {fileKind === 'pdf' && numPages > 0 && (
              <span className="text-xs text-[#6B7E92] ml-1">· {numPages} стр.</span>
            )}
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
        <div ref={inlineContainerRef} className="flex-1 overflow-hidden">
          {renderPreview('inline')}
        </div>
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
          className="fixed inset-0 z-50 bg-white flex flex-col"
          role="dialog"
          aria-label="Превью договора на весь экран"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D6E6F3] bg-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-semibold text-[#0D1B2A] truncate">
                {file?.name ?? 'Превью договора'}
              </p>
              {fileKind === 'pdf' && numPages > 0 && (
                <span className="text-xs text-[#6B7E92]">· {numPages} стр.</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {fileKind === 'pdf' && (
                <>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    className="p-1.5 rounded-lg hover:bg-[#D6E6F3]/50 transition-colors"
                    title="Уменьшить"
                  >
                    <ZoomOut size={18} className="text-[#6B7E92]" strokeWidth={1.5} />
                  </button>
                  <span className="text-xs text-[#6B7E92] tabular-nums w-10 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                    className="p-1.5 rounded-lg hover:bg-[#D6E6F3]/50 transition-colors"
                    title="Увеличить"
                  >
                    <ZoomIn size={18} className="text-[#6B7E92]" strokeWidth={1.5} />
                  </button>
                  <div className="w-px h-5 bg-[#D6E6F3] mx-1" />
                </>
              )}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-[#D6E6F3]/50 transition-colors"
                title="Закрыть (Esc)"
              >
                <X size={20} className="text-[#6B7E92]" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div ref={fullContainerRef} className="flex-1 overflow-hidden">
            {renderPreview('full')}
          </div>
        </div>
      )}
    </>
  )
}
