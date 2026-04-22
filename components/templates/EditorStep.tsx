'use client'

import { FieldsEditor } from './FieldsEditor'
import { DocumentPreview } from './DocumentPreview'
import { FieldMappingPanel } from './FieldMappingPanel'
import type { EditableField } from './FieldRow'
import type { DocxPatch } from '@/lib/types'

interface EditorStepProps {
  file: File | null
  fileUrl: string | null
  fileKind: 'pdf' | 'docx' | null
  sourceFilePath?: string | null
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
  aiParseFailed?: boolean
  activeFieldId?: string | null
  onFieldSelect?: (id: string | null) => void
  onFieldAddWithPatch?: (field: EditableField, patch: DocxPatch) => void
}

export function EditorStep(props: EditorStepProps) {
  const {
    file, fileUrl, fileKind, sourceFilePath, fields, patches,
    activeFieldId, onFieldSelect,
    onFieldAddWithPatch: _onFieldAddWithPatch,
    ...editorProps
  } = props
  void _onFieldAddWithPatch

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5 lg:gap-6">
      <div className="order-1 lg:order-1">
        <FieldsEditor
          fields={fields}
          activeFieldId={activeFieldId}
          onFieldSelect={onFieldSelect}
          {...editorProps}
        />
      </div>
      <div className="order-2 lg:order-2 lg:sticky lg:top-4 lg:self-start space-y-4">
        <DocumentPreview
          file={file}
          fileUrl={fileUrl}
          fileKind={fileKind}
          fields={fields}
          patches={patches ?? []}
          sourceFilePath={sourceFilePath ?? null}
        />
        <FieldMappingPanel fields={fields} patches={patches} />
      </div>
    </div>
  )
}
