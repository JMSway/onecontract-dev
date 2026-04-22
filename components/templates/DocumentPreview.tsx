'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Expand, X, FileText, ZoomIn, ZoomOut } from 'lucide-react'
import { BoxLoader } from '@/components/ui/BoxLoader'
import { Document, Page, pdfjs } from 'react-pdf'
import { GROUP_HIGHLIGHT_COLORS } from '@/lib/field-groups'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface DocumentPreviewProps {
  file: File | null
  fileUrl: string | null
  fileKind: 'pdf' | 'docx' | null
  highlightKeys?: string[]
  fieldGroups?: Record<string, string>
  activeFieldKey?: string | null
  onFieldClick?: (key: string) => void
  onBlankClick?: (searchText: string) => void
}

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

export function DocumentPreview({
  file,
  fileUrl,
  fileKind,
  highlightKeys,
  fieldGroups,
  activeFieldKey,
  onFieldClick,
  onBlankClick,
}: DocumentPreviewProps) {
  const [docxHtml, setDocxHtml] = useState<string>('')
  const [docxLoading, setDocxLoading] = useState(false)
  const [docxError, setDocxError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const [numPages, setNumPages] = useState<number>(0)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfLoadTimeout, setPdfLoadTimeout] = useState(false)
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [zoom, setZoom] = useState(1)

  const inlineContainerRef = useRef<HTMLDivElement | null>(null)
  const fullContainerRef = useRef<HTMLDivElement | null>(null)
  const [inlineWidth, setInlineWidth] = useState(0)
  const [fullWidth, setFullWidth] = useState(0)

  const docxContainerRef = useRef<HTMLDivElement>(null)

  const pdfSource = useMemo(() => file ?? fileUrl, [file, fileUrl])

  useEffect(() => {
    if (fileKind !== 'docx') return
    if (!file && !fileUrl) return
    let cancelled = false
    let abortController: AbortController | null = null
    setDocxLoading(true)
    setDocxError(null)
    ;(async () => {
      try {
        const mammoth = await import('mammoth/mammoth.browser')
        let arrayBuffer: ArrayBuffer
        if (file) {
          arrayBuffer = await file.arrayBuffer()
        } else {
          abortController = new AbortController()
          const timeoutId = setTimeout(() => abortController!.abort(), 15000)
          const response = await fetch(fileUrl!, { signal: abortController.signal })
          clearTimeout(timeoutId)
          arrayBuffer = await response.arrayBuffer()
        }
        const result = await mammoth.convertToHtml({ arrayBuffer })
        let html = result.value

        if (highlightKeys?.length) {
          for (const key of highlightKeys) {
            const group = fieldGroups?.[key] ?? 'other'
            const colors = GROUP_HIGHLIGHT_COLORS[group] ?? GROUP_HIGHLIGHT_COLORS.other
            const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const re = new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, 'g')
            html = html.replace(
              re,
              `<mark data-field-key="${key}" data-border-color="${colors.border}" style="background:${colors.bg};border:1px solid ${colors.border};border-radius:3px;padding:1px 4px;font-size:0.9em;cursor:pointer" title="${key}">{{${key}}}</mark>`
            )
          }
        }

        html = html.replace(
          /([^<]{0,30})(_{5,})/g,
          (_match, context: string, underscores: string) => {
            const searchText = (context + underscores).trim()
            return `${context}<mark class="blank-marker" data-search="${searchText.replace(/"/g, '&quot;')}" style="background:#FEE2E2;border:1px dashed #EF4444;border-radius:3px;padding:2px 6px;font-size:0.85em;cursor:pointer" title="Нажмите чтобы добавить поле">____</mark>`
          }
        )

        if (!cancelled) setDocxHtml(html)
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
      abortController?.abort()
    }
  }, [file, fileUrl, fileKind, highlightKeys?.join('|'), fieldGroups && JSON.stringify(fieldGroups)])

  // Click delegation on docx marks
  useEffect(() => {
    const container = docxContainerRef.current
    if (!container) return
    const handleClick = (e: MouseEvent) => {
      const mark = (e.target as HTMLElement).closest('mark')
      if (!mark) return
      const fieldKey = mark.getAttribute('data-field-key')
      if (fieldKey && onFieldClick) { onFieldClick(fieldKey); return }
      const searchText = mark.getAttribute('data-search')
      if (searchText && onBlankClick) { onBlankClick(searchText); return }
    }
    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [docxHtml, onFieldClick, onBlankClick])

  // Active field highlight via DOM manipulation (no re-render needed)
  useEffect(() => {
    const container = docxContainerRef.current
    if (!container) return
    container.querySelectorAll<HTMLElement>('mark[data-field-key]').forEach((el) => {
      const bc = el.dataset.borderColor ?? '#9CA3AF'
      el.style.border = `1px solid ${bc}`
      el.style.boxShadow = ''
      el.style.animation = ''
    })
    if (!activeFieldKey) return
    container.querySelectorAll<HTMLElement>(`mark[data-field-key="${activeFieldKey}"]`).forEach((el) => {
      const bc = el.dataset.borderColor ?? '#0F52BA'
      el.style.border = `2px solid ${bc}`
      el.style.boxShadow = `0 0 0 2px ${bc}33`
      el.style.animation = 'fieldPulse 1s ease-in-out infinite'
    })
  }, [activeFieldKey, docxHtml])

  // Scroll to active mark in document
  useEffect(() => {
    if (!activeFieldKey || !docxContainerRef.current) return
    const mark = docxContainerRef.current.querySelector(`mark[data-field-key="${activeFieldKey}"]`)
    if (mark) mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeFieldKey])

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
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
    setPdfLoadTimeout(false)
    setNumPages(n)
    setPdfLoading(false)
    setPdfError(null)
  }, [])

  const handleLoadError = useCallback((err: Error) => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
    setPdfLoadTimeout(false)
    console.error('[DocumentPreview] pdf load error:', err)
    setPdfError('Не удалось загрузить PDF')
    setPdfLoading(false)
  }, [])

  const handleLoadStart = useCallback(() => {
    setPdfLoading(true)
    setPdfError(null)
    setPdfLoadTimeout(false)
    loadTimeoutRef.current = setTimeout(() => setPdfLoadTimeout(true), 12000)
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
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              {pdfLoadTimeout ? (
                <>
                  <p className="text-sm text-[#6B7E92] text-center">Загрузка занимает дольше обычного</p>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0F52BA] hover:underline font-medium"
                    >
                      Открыть в новой вкладке →
                    </a>
                  )}
                </>
              ) : (
                <BoxLoader />
              )}
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
        <div className="flex flex-col items-center justify-center p-6 text-center h-full gap-3">
          <p className="text-sm text-[#6B7E92]">{docxError}</p>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0F52BA] hover:underline font-medium"
            >
              Открыть в новой вкладке →
            </a>
          )}
        </div>
      )
    }
    return (
      <div className="w-full h-full overflow-auto bg-white">
        <div
          ref={docxContainerRef}
          className="docx-preview"
          dangerouslySetInnerHTML={{ __html: docxHtml }}
        />
      </div>
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
