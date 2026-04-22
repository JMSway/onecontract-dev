'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { UploadResult } from '@/components/templates/UploadStep'
import type { EditableField } from '@/components/templates/FieldRow'

const UploadStep = dynamic(
  () => import('@/components/templates/UploadStep').then(m => ({ default: m.UploadStep })),
  { ssr: false },
)
const EditorStep = dynamic(
  () => import('@/components/templates/EditorStep').then(m => ({ default: m.EditorStep })),
  { ssr: false },
)
import type { DocxPatch, Template, TemplateField } from '@/lib/types'

type Step = 'upload' | 'edit'

export default function NewTemplatePage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileStoragePath, setFileStoragePath] = useState<string | null>(null)
  const [fileKind, setFileKind] = useState<'pdf' | 'docx' | null>(null)

  const [fields, setFields] = useState<EditableField[]>([])
  const [patches, setPatches] = useState<DocxPatch[]>([])
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const [aiParseFailed, setAiParseFailed] = useState(false)

  const handleReady = (r: UploadResult) => {
    setFile(r.file)
    setFileUrl(r.fileUrl)
    setFileStoragePath(r.fileStoragePath)
    setFileKind(r.fileKind)
    setFields(r.fields)
    setPatches(r.patches ?? [])
    setTemplateName(r.baseName)
    setDescription('')
    setError(null)
    setAiUnavailable(r.aiUnavailable ?? false)
    setAiParseFailed(r.aiParseFailed ?? false)
    setStep('edit')
  }

  const updateField = (id: string, patch: Partial<EditableField>) =>
    setFields((prev) => prev.map((f) => (f._id === id ? { ...f, ...patch } : f)))

  const removeField = (id: string) =>
    setFields((prev) => prev.filter((f) => f._id !== id))

  const addField = () => {
    const id = crypto.randomUUID()
    const key = `field_${Date.now()}`
    setFields((prev) => [
      ...prev,
      {
        _id: id,
        key,
        label: '',
        type: 'text',
        required: true,
        filled_by: 'client',
        group: 'other',
      },
    ])
    setActiveFieldId(id)
  }

  const addFieldWithPatch = (field: EditableField, patch: DocxPatch) => {
    setFields((prev) => [...prev, field])
    setPatches((prev) => [...prev, patch])
    setActiveFieldId(field._id)
  }

  const handleCancel = () => {
    router.push('/dashboard/templates')
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
        .map(({ _id: _id, ...rest }) => {
          void _id
          return rest
        })

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: description.trim() || undefined,
          fields: cleanFields,
          source_file_url: fileUrl,
          source_file_path: fileStoragePath,
          file_kind: fileKind,
          patches,
        }),
      })
      const json = (await res.json()) as { template?: Template; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Ошибка сохранения')
      router.push('/dashboard/templates')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка при сохранении')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard/templates"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7E92] hover:text-[#0D1B2A] transition-colors mb-3"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          К шаблонам
        </Link>
        <h1 className="text-2xl font-bold text-[#0D1B2A] tracking-tight">
          {step === 'upload' ? 'Новый шаблон' : 'Настройка шаблона'}
        </h1>
        <p className="text-sm text-[#6B7E92] mt-0.5">
          {step === 'upload'
            ? 'Шаг 1 из 2 — загрузите файл договора'
            : 'Шаг 2 из 2 — проверьте поля, найденные AI, и сохраните'}
        </p>
      </div>

      <div className="transition-opacity duration-200">
        {step === 'upload' ? (
          <UploadStep onReady={handleReady} />
        ) : (
          <EditorStep
            file={file}
            fileUrl={fileUrl}
            fileKind={fileKind}
            sourceFilePath={fileStoragePath}
            templateName={templateName}
            onNameChange={setTemplateName}
            description={description}
            onDescriptionChange={setDescription}
            fields={fields}
            patches={patches}
            onFieldChange={updateField}
            onFieldRemove={removeField}
            onFieldAdd={addField}
            onCancel={handleCancel}
            onSave={handleSave}
            saving={saving}
            error={error}
            aiUnavailable={aiUnavailable}
            aiParseFailed={aiParseFailed}
            activeFieldId={activeFieldId}
            onFieldSelect={setActiveFieldId}
            onFieldAddWithPatch={addFieldWithPatch}
          />
        )}
      </div>
    </div>
  )
}
