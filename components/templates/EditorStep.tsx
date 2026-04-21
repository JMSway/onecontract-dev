'use client'

import { FieldsEditor } from './FieldsEditor'
import { DocumentPreview } from './DocumentPreview'
import type { EditableField } from './FieldRow'

interface EditorStepProps {
  file: File | null
  fileUrl: string | null
  fileKind: 'pdf' | 'docx' | null
  templateName: string
  onNameChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  fields: EditableField[]
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
  const { file, fileUrl, fileKind, ...editorProps } = props

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5 lg:gap-6">
      <div className="order-1 lg:order-1">
        <FieldsEditor {...editorProps} />
      </div>
      <div className="order-2 lg:order-2 lg:sticky lg:top-4 lg:self-start">
        <DocumentPreview file={file} fileUrl={fileUrl} fileKind={fileKind} />
      </div>
    </div>
  )
}
