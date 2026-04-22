'use client'

import { useMemo } from 'react'
import { FieldsEditor } from './FieldsEditor'
import { DocumentPreview } from './DocumentPreview'
import { FieldMappingPanel } from './FieldMappingPanel'
import type { EditableField } from './FieldRow'
import type { DocxPatch } from '@/lib/types'

interface EditorStepProps {
  file: File | null
  fileUrl: string | null
  fileKind: 'pdf' | 'docx' | null
  templateName: string
  onNameChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  fields: EditableField[]
  patches?: DocxPatch[]
  onFieldChange: (id: string, patch: Partial<EditableField>) => void
  onFieldRemove: (id: string) => void
  onFieldAdd: () => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
  error: string | null
  aiUnavailable?: boolean
}

export function EditorStep(props: EditorStepProps) {
  const { file, fileUrl, fileKind, fields, patches, ...editorProps } = props

  const fieldGroups = useMemo(() => {
    const map: Record<string, string> = {}
    for (const f of fields) {
      map[f.key] = f.group ?? 'other'
    }
    return map
  }, [fields])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5 lg:gap-6">
      <div className="order-1 lg:order-1">
        <FieldsEditor fields={fields} {...editorProps} />
      </div>
      <div className="order-2 lg:order-2 lg:sticky lg:top-4 lg:self-start">
        <DocumentPreview
          file={file}
          fileUrl={fileUrl}
          fileKind={fileKind}
          highlightKeys={fields.map((f) => f.key).filter((k) => k.length > 0)}
          fieldGroups={fieldGroups}
        />
        <FieldMappingPanel fields={fields} patches={patches} />
      </div>
    </div>
  )
}
