'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Expand, X, FileText, Loader2, ZoomIn, ZoomOut, AlertCircle, Info } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { GROUP_HIGHLIGHT_COLORS } from '@/lib/field-groups'
import type { TemplateField, DocxPatch } from '@/lib/types'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

interface DocumentPreviewProps {
  file: File | null
  fileUrl: string | null
  fileKind: 'pdf' | 'docx' | null
  fields?: TemplateField[]
  patches?: DocxPatch[]
  sourceFilePath?: string | null
}

export function DocumentPreview({
  file, fileUrl, fileKind,
  fields = [], patches = [], sourceFilePath = null,
}: DocumentPreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [retryCounter, setRetryCounter] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const canGeneratePreview =
    fileKind === 'docx' && !!sourceFilePath && patches.length > 0 && fields.length > 0

  const fieldsFingerprint = useMemo(
    () => JSON.stringify(fields.map((f) => ({ k: f.key, l: f.label, g: f.group ?? 'other' }))),
    [fields]
  )
  const patchesFingerprint = useMemo(() => JSON.stringify(patches), [patches])

  useEffect(() => {
    if (!canGeneratePreview) {
      setPreviewBlobUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return null
      })
      setPreviewError(null)
      setPreviewLoading(false)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const generate = async () => {
      setPreviewLoading(true)
      setPreviewError(null)
      try {
        const res = await fetch('/api/templates/preview-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_file_path: sourceFilePath,
            file_kind: 'docx',
            patches,
            fields,
          }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(json.error ?? 'Ошибка генерации превью')
        }
        const blob = await res.blob()
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        setPreviewBlobUrl((old) => {
          if (old) URL.revokeObjectURL(old)
          return url
        })
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return
        setPreviewError(e instanceof Error ? e.message : 'Ошибка')
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }

    const timer = setTimeout(generate, 800)
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGeneratePreview, sourceFilePath, fieldsFingerprint, patchesFingerprint, retryCounter])

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth - 24)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [expanded])

  const highlightLabels = useCallback(() => {
    if (!containerRef.current) return
    const textLayers = containerRef.current.querySelectorAll('.react-pdf__Page__textContent')

    textLayers.forEach((layer) => {
      const spans = layer.querySelectorAll('span')
      spans.forEach((span) => {
        const text = span.textContent ?? ''
        const match = text.match(/\[([^\]]+)\]/)
        if (!match) return
        const labelText = match[1]
        const field = fields.find((f) => f.label === labelText)
        if (!field) return
        const group = field.group ?? 'other'
        const colors = GROUP_HIGHLIGHT_COLORS[group] ?? GROUP_HIGHLIGHT_COLORS.other
        const el = span as HTMLElement
        el.style.color = colors.border
        el.style.fontWeight = '600'
      })
    })
  }, [fields])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  const fileName = file?.name ?? (fileKind === 'docx' ? 'Документ.docx' : 'Документ.pdf')

  const showOriginalPdf = fileKind === 'pdf' && !!fileUrl
  const showPreview = fileKind === 'docx' && !!previewBlobUrl
  const pdfSource = showPreview ? previewBlobUrl : showOriginalPdf ? fileUrl : null

  const pageWidth = Math.max(320, Math.min(containerWidth * zoom, 1000))

  const body = (
    <div ref={containerRef} className="flex-1 overflow-auto bg-[#F8FAFC] p-3">
      {!pdfSource && previewLoading && (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
          <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-[#0F52BA]" />
          <p className="text-xs text-[#6B7E92]">Генерируем превью с полями…</p>
        </div>
      )}

      {previewError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 m-1">
          <AlertCircle size={14} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Не удалось сгенерировать превью</p>
            <p className="mt-1">{previewError}</p>
            <button
              type="button"
              onClick={() => setRetryCounter((n) => n + 1)}
              className="mt-2 text-[11px] font-semibold text-[#0F52BA] hover:underline"
            >
              Повторить
            </button>
          </div>
        </div>
      )}

      {!pdfSource && !previewLoading && !previewError && fileKind === 'docx' && !sourceFilePath && (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-6">
          <Info size={28} strokeWidth={1.5} className="text-[#A6C5D7]" />
          <p className="text-sm text-[#6B7E92]">
            Превью с метками доступно при создании шаблона.
          </p>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0F52BA] hover:underline"
            >
              Открыть оригинал
            </a>
          )}
        </div>
      )}

      {!pdfSource && !previewLoading && !previewError && fileKind === 'docx' && sourceFilePath && (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-6">
          <FileText size={32} strokeWidth={1.5} className="text-[#A6C5D7]" />
          <p className="text-sm text-[#6B7E92]">
            Добавьте поля слева — превью появится автоматически
          </p>
        </div>
      )}

      {!pdfSource && !previewLoading && !previewError && !fileKind && (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-6">
          <FileText size={32} strokeWidth={1.5} className="text-[#A6C5D7]" />
          <p className="text-sm text-[#6B7E92]">Загрузите документ для предпросмотра</p>
        </div>
      )}

      {pdfSource && (
        <Document
          file={pdfSource}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={(err) => setPreviewError(err.message)}
          options={PDF_OPTIONS}
          loading={
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-[#0F52BA]" />
            </div>
          }
        >
          {Array.from(new Array(numPages), (_, i) => (
            <div key={i} className="mb-3 shadow-sm bg-white mx-auto w-fit">
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                onRenderTextLayerSuccess={highlightLabels}
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  )

  return (
    <>
      <div className="bg-white border border-[#D6E6F3] rounded-2xl shadow-sm flex flex-col overflow-hidden h-[60vh] lg:h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8FAFC] border-b border-[#D6E6F3] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={14} strokeWidth={1.5} className="text-[#0F52BA] shrink-0" />
            <span className="text-xs font-medium text-[#0D1B2A] truncate">{fileName}</span>
            {previewLoading && (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin text-[#0F52BA] shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1.5 hover:bg-[#D6E6F3]/50 rounded-lg transition-colors"
              title="Уменьшить"
            >
              <ZoomOut size={13} strokeWidth={1.5} className="text-[#6B7E92]" />
            </button>
            <span className="text-[10px] text-[#6B7E92] w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-1.5 hover:bg-[#D6E6F3]/50 rounded-lg transition-colors"
              title="Увеличить"
            >
              <ZoomIn size={13} strokeWidth={1.5} className="text-[#6B7E92]" />
            </button>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="p-1.5 hover:bg-[#D6E6F3]/50 rounded-lg transition-colors ml-1"
              title="Развернуть"
            >
              <Expand size={13} strokeWidth={1.5} className="text-[#6B7E92]" />
            </button>
          </div>
        </div>

        {fileKind === 'pdf' && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
            <p className="text-[11px] text-amber-700 leading-snug">
              Метки недоступны для PDF — загрузите DOCX для полного превью
            </p>
          </div>
        )}

        {fileKind === 'docx' && canGeneratePreview && (
          <div className="px-4 py-2 bg-[#D6E6F3]/30 border-b border-[#D6E6F3] shrink-0">
            <p className="text-[11px] text-[#0F52BA] leading-snug">
              <span className="font-semibold">Цветом выделены места</span> куда попадут значения полей при подписании
            </p>
          </div>
        )}

        {!expanded && body}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-label="Превью договора на весь экран"
        >
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#D6E6F3]">
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
            {body}
          </div>
        </div>
      )}
    </>
  )
}
