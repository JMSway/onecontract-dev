'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import type { Template, TemplateField } from '@/lib/types'

const FIELD_TYPES: { value: TemplateField['type']; label: string }[] = [
  { value: 'text', label: 'Текст' },
  { value: 'number', label: 'Число / Сумма' },
  { value: 'date', label: 'Дата' },
  { value: 'phone', label: 'Телефон' },
  { value: 'iin', label: 'ИИН / Удостоверение' },
  { value: 'email', label: 'Email' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

type Step = 'upload' | 'edit'

interface EditableField extends TemplateField {
  _id: string
}

function newField(): EditableField {
  return { _id: crypto.randomUUID(), key: '', label: '', type: 'text', required: true }
}

interface UploadModalProps {
  onClose: () => void
  onSaved: (template: Template) => void
}

function UploadModal({ onClose, onSaved }: UploadModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState<EditableField[]>([])
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    const isPdf = file.type === 'application/pdf'
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (!isPdf && !isDocx) {
      setError('Поддерживаются только .docx и .pdf файлы')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой (максимум 10 МБ)')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/templates/extract', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Ошибка извлечения полей')

      const extracted: TemplateField[] = json.fields ?? []
      setFields(extracted.map((f) => ({ ...f, _id: crypto.randomUUID() })))
      setSourceUrl(json.source_file_url)

      const baseName = file.name.replace(/\.(docx|pdf)$/i, '')
      setTemplateName(baseName)
      setStep('edit')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка при анализе файла')
    } finally {
      setLoading(false)
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const updateField = (id: string, patch: Partial<EditableField>) => {
    setFields((prev) => prev.map((f) => (f._id === id ? { ...f, ...patch } : f)))
  }

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f._id !== id))
  }

  const addField = () => {
    setFields((prev) => [...prev, newField()])
  }

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Укажите название шаблона')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const cleanFields: TemplateField[] = fields
        .filter((f) => f.key.trim() && f.label.trim())
        .map(({ _id: _, ...rest }) => rest)

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: description.trim() || undefined,
          fields: cleanFields,
          source_file_url: sourceUrl,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Ошибка сохранения')
      onSaved(json.template as Template)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92dvh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#0D1B2A]">
            {step === 'upload' ? 'Загрузить шаблон' : 'Настройка шаблона'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-[#6B7E92]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-[#6B7E92]">
                Загрузите файл договора — AI найдёт все поля для заполнения.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !loading && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors select-none ${
                  dragging
                    ? 'border-[#0F52BA] bg-[#D6E6F3]/30'
                    : 'border-[#A6C5D7] hover:border-[#0F52BA] hover:bg-[#D6E6F3]/20'
                } ${loading ? 'pointer-events-none opacity-60' : ''}`}
              >
                {loading ? (
                  <>
                    <Loader2 size={40} className="text-[#0F52BA] animate-spin" />
                    <p className="text-sm font-medium text-[#0D1B2A]">AI анализирует договор…</p>
                    <p className="text-xs text-[#6B7E92]">Обычно занимает 10–30 секунд</p>
                  </>
                ) : (
                  <>
                    <Upload size={40} className="text-[#A6C5D7]" />
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
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {/* Step 2: Edit fields */}
          {step === 'edit' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7E92] mb-1.5">
                    Название шаблона *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Например: Договор об оказании услуг"
                    className="w-full border border-[#A6C5D7] rounded-xl px-4 py-2.5 text-sm text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7E92] mb-1.5">
                    Описание (необязательно)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Краткое описание шаблона"
                    rows={2}
                    className="w-full border border-[#A6C5D7] rounded-xl px-4 py-2.5 text-sm text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA] resize-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#6B7E92]">
                    Поля ({fields.length})
                  </label>
                  {fields.length === 0 && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle size={12} /> AI не нашёл полей, добавьте вручную
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {fields.map((field) => (
                    <FieldRow
                      key={field._id}
                      field={field}
                      onChange={(patch) => updateField(field._id, patch)}
                      onRemove={() => removeField(field._id)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addField}
                  className="mt-3 flex items-center gap-1.5 text-sm text-[#0F52BA] hover:text-blue-700 transition-colors font-medium"
                >
                  <Plus size={16} />
                  Добавить поле
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {step === 'edit' && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-[#A6C5D7] text-[#0D1B2A] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#D6E6F3]/30 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !templateName.trim()}
              className="flex-1 bg-[#0F52BA] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Сохранение…</> : 'Сохранить шаблон'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Field Row ───────────────────────────────────────────────────────────────

interface EditableField extends TemplateField {
  _id: string
}

interface FieldRowProps {
  field: EditableField
  onChange: (patch: Partial<EditableField>) => void
  onRemove: () => void
}

function FieldRow({ field, onChange, onRemove }: FieldRowProps) {
  const isDate = field.type === 'date'

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 group">
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Название поля"
          className="w-full bg-transparent text-sm text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none"
        />
        {isDate && (
          <span className="flex items-center gap-1 text-[10px] text-[#0F7B55] mt-0.5">
            <Calendar size={10} /> автозаполняется при отправке
          </span>
        )}
      </div>

      <div className="relative shrink-0">
        <select
          value={field.type}
          onChange={(e) => onChange({ type: e.target.value as TemplateField['type'] })}
          className="appearance-none bg-white border border-[#A6C5D7] rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 cursor-pointer"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7E92] pointer-events-none" />
      </div>

      <button
        type="button"
        onClick={() => onChange({ required: !field.required })}
        title={field.required ? 'Обязательное' : 'Необязательное'}
        className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
          field.required
            ? 'bg-[#0F52BA]/10 text-[#0F52BA]'
            : 'bg-gray-200 text-[#6B7E92]'
        }`}
      >
        *
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 p-1 rounded-lg text-[#6B7E92] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Template Card ───────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: Template
  onDelete: (id: string) => void
}

function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Удалить шаблон «${template.name}»?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
      onDelete(template.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white border border-[#D6E6F3] rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-[#A6C5D7] transition-colors">
      <div className="w-10 h-10 rounded-xl bg-[#D6E6F3] flex items-center justify-center shrink-0">
        <FileText size={20} className="text-[#0F52BA]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0D1B2A] truncate">{template.name}</p>
        <p className="text-xs text-[#6B7E92] mt-0.5">
          {template.fields.length} {pluralFields(template.fields.length)} · создан {formatDate(template.created_at)}
        </p>
        {template.description && (
          <p className="text-xs text-[#6B7E92] mt-0.5 truncate">{template.description}</p>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 p-2 rounded-xl text-[#6B7E92] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Удалить шаблон"
      >
        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  )
}

function pluralFields(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'поле'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'поля'
  return 'полей'
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyTemplates({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#D6E6F3] flex items-center justify-center mb-4">
        <FileText size={32} className="text-[#0F52BA]" />
      </div>
      <h3 className="text-lg font-semibold text-[#0D1B2A] mb-2">Нет шаблонов</h3>
      <p className="text-sm text-[#6B7E92] max-w-xs mb-6">
        Загрузите ваш договор — AI автоматически найдёт все поля для заполнения.
      </p>
      <button
        onClick={onUpload}
        className="bg-[#0F52BA] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Upload size={16} />
        Загрузить первый шаблон
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (template: Template) => {
    setTemplates((prev) => [template, ...prev])
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Шаблоны</h1>
          <p className="text-sm text-[#6B7E92] mt-0.5">Шаблоны договоров вашей организации</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0F52BA] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Загрузить шаблон</span>
          <span className="sm:hidden">Загрузить</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-[#0F52BA] animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyTemplates onUpload={() => setShowModal(true)} />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <UploadModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </>
  )
}
