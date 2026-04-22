'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BoxLoader } from '@/components/ui/BoxLoader'
import type { TemplateField, DocxPatch } from '@/lib/types'
import type { EditableField } from './FieldRow'

type FileKind = 'pdf' | 'docx'

export interface UploadResult {
  file: File
  fileUrl: string | null
  fileStoragePath: string | null
  fileKind: FileKind
  fields: EditableField[]
  patches: DocxPatch[]
  baseName: string
  aiUnavailable?: boolean
  aiParseFailed?: boolean
}

interface UploadStepProps {
  onReady: (result: UploadResult) => void
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth/mammoth.browser')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ') + '\n'
  }
  return text
}

export function UploadStep({ onReady }: UploadStepProps) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Читаем файл…')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      const isPdf = file.type === 'application/pdf'
      const isDocx =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      if (!isPdf && !isDocx) {
        setError('Поддерживаются только .docx и .pdf файлы')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой (максимум 10 МБ)')
        return
      }

      setLoading(true)
      setLoadingMsg('Читаем файл…')

      const fileKind: FileKind = isDocx ? 'docx' : 'pdf'

      try {
        let text: string
        try {
          if (isDocx) {
            text = await extractDocxText(file)
          } else {
            setLoadingMsg('Читаем PDF…')
            text = await extractPdfText(file)
          }
        } catch (e) {
          console.error('[UploadStep] client parse error:', e)
          throw new Error('Не удалось прочитать файл. Убедитесь что файл не повреждён.')
        }

        if (!text.trim()) {
          throw new Error('Файл пустой или защищён паролем — текст не найден.')
        }

        setLoadingMsg('Загружаем файл…')
        let fileUrl: string | null = null
        let fileStoragePath: string | null = null
        try {
          const supabase = createClient()
          const ext = fileKind
          const path = `${Date.now()}_${file.name.replace(/[^a-z0-9._-]/gi, '_')}.${ext}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('templates')
            .upload(path, file, { contentType: file.type, upsert: false })
          if (!uploadError && uploadData) {
            fileStoragePath = uploadData.path
            const { data: signed } = await supabase.storage
              .from('templates')
              .createSignedUrl(uploadData.path, 60 * 60)
            fileUrl = signed?.signedUrl ?? null
          }
        } catch {
          // non-critical; continue without preview URL (docx uses File directly anyway)
        }

        setLoadingMsg('Анализ договора (большие документы могут занять до минуты)…')
        const res = await fetch('/api/templates/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        const json = (await res.json()) as {
          fields?: TemplateField[]
          patches?: DocxPatch[]
          error?: string
          aiUnavailable?: boolean
          aiParseFailed?: boolean
        }
        if (!res.ok) throw new Error(json.error ?? 'Ошибка AI-анализа')

        const extracted: TemplateField[] = json.fields ?? []
        const patches: DocxPatch[] = json.patches ?? []
        const editable: EditableField[] = extracted.map((f) => ({
          ...f,
          _id: crypto.randomUUID(),
        }))

        const baseName = file.name.replace(/\.(docx|pdf)$/i, '')

        onReady({
          file, fileUrl, fileStoragePath, fileKind,
          fields: editable, patches, baseName,
          aiUnavailable: json.aiUnavailable ?? false,
          aiParseFailed: json.aiParseFailed ?? false,
        })
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Ошибка при обработке файла')
        setLoading(false)
      }
    },
    [onReady]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#0D1B2A] mb-1">Загрузить шаблон</h2>
        <p className="text-sm text-[#6B7E92]">
          Загрузите файл договора — AI найдёт все поля для заполнения, а вы сможете проверить
          результат рядом с оригиналом.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer select-none transition-all duration-150 ${
          dragging
            ? 'border-[#0F52BA] bg-[#D6E6F3]/40'
            : 'border-[#A6C5D7] hover:border-[#0F52BA] hover:bg-[#D6E6F3]/20'
        } ${loading ? 'pointer-events-none opacity-70' : ''}`}
      >
        {loading ? (
          <>
            <BoxLoader />
            <p className="text-sm font-medium text-[#0D1B2A] mt-2">{loadingMsg}</p>
            <p className="text-xs text-[#6B7E92]">Обычно занимает 10–30 секунд</p>
          </>
        ) : (
          <>
            <Upload size={40} className="text-[#A6C5D7]" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[#0D1B2A]">
              Перетащите файл или нажмите для выбора
            </p>
            <p className="text-xs text-[#6B7E92]">.docx или .pdf, до 10 МБ</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
