'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { FieldsEditor } from '@/components/templates/FieldsEditor'
import { FieldMappingPanel } from '@/components/templates/FieldMappingPanel'

const DocumentPreview = dynamic(
  () => import('@/components/templates/DocumentPreview').then(m => ({ default: m.DocumentPreview })),
  { ssr: false },
)
import type { EditableField } from '@/components/templates/FieldRow'
import type { Template, TemplateField } from '@/lib/types'

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [contractCount, setContractCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [fields, setFields] = useState<EditableField[]>([])
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((data: { template?: Template; contractCount?: number; error?: string }) => {
        if (data.error || !data.template) {
          setLoadError(data.error ?? 'Шаблон не найден')
          return
        }
        const t = data.template
        setTemplate(t)
        setContractCount(data.contractCount ?? 0)
        setTemplateName(t.name)
        setDescription(t.description ?? '')
        setFields(
          t.fields.map((f) => ({ ...f, _id: crypto.randomUUID() }))
        )
      })
      .catch(() => setLoadError('Ошибка загрузки шаблона'))
      .finally(() => setLoading(false))
  }, [id])

  const updateField = (fieldId: string, patch: Partial<EditableField>) =>
    setFields((prev) => prev.map((f) => (f._id === fieldId ? { ...f, ...patch } : f)))

  const removeField = (fieldId: string) =>
    setFields((prev) => prev.filter((f) => f._id !== fieldId))

  const addField = () =>
    setFields((prev) => [
      ...prev,
      { _id: crypto.randomUUID(), key: '', label: '', type: 'text', required: true, filled_by: 'manager' },
    ])

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

      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: description.trim() || undefined,
          fields: cleanFields,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-[#0F52BA] animate-spin" strokeWidth={1.5} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-red-600 mb-4">{loadError}</p>
        <Link href="/dashboard/templates" className="text-sm text-[#0F52BA] hover:underline">
          ← К шаблонам
        </Link>
      </div>
    )
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
        <h1 className="text-2xl font-bold text-[#0D1B2A] tracking-tight">Редактирование шаблона</h1>
        <p className="text-sm text-[#6B7E92] mt-0.5">
          {template?.name}
        </p>
      </div>

      {contractCount > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={1.5} />
          Этот шаблон используется в {contractCount} {contractCount === 1 ? 'договоре' : contractCount < 5 ? 'договорах' : 'договорах'}. Изменения не повлияют на уже созданные договоры.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5 lg:gap-6">
        <div className="order-1">
          <FieldsEditor
            templateName={templateName}
            onNameChange={setTemplateName}
            description={description}
            onDescriptionChange={setDescription}
            fields={fields}
            onFieldChange={updateField}
            onFieldRemove={removeField}
            onFieldAdd={addField}
            onCancel={() => router.push('/dashboard/templates')}
            onSave={handleSave}
            saving={saving}
            error={error}
          />
        </div>
        <div className="order-2 lg:sticky lg:top-4 lg:self-start">
          {template?.source_file_url ? (
            <>
              <DocumentPreview
                file={null}
                fileUrl={template.source_file_url}
                fileKind={
                  template.source_file_url.toLowerCase().includes('.docx') ? 'docx' : 'pdf'
                }
              />
              <FieldMappingPanel fields={fields} />
            </>
          ) : (
            <FieldMappingPanel fields={fields} />
          )}
        </div>
      </div>
    </div>
  )
}