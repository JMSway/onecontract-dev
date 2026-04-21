'use client'

import { Plus, AlertCircle, Loader2 } from 'lucide-react'
import { FieldRow, type EditableField } from './FieldRow'

interface FieldsEditorProps {
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

export function FieldsEditor({
  templateName,
  onNameChange,
  description,
  onDescriptionChange,
  fields,
  onFieldChange,
  onFieldRemove,
  onFieldAdd,
  onCancel,
  onSave,
  saving,
  error,
  aiUnavailable,
}: FieldsEditorProps) {
  return (
    <div className="bg-white border border-[#D6E6F3] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {aiUnavailable && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          AI-анализ недоступен — добавьте поля вручную или настройте ключ OpenRouter в Cloudflare
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7E92] mb-1.5">
            Название шаблона *
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Например: Договор об оказании услуг"
            className="w-full border border-[#A6C5D7] rounded-xl px-4 py-2.5 text-sm text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7E92] mb-1.5">
            Описание (необязательно)
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Краткое описание шаблона"
            rows={2}
            className="w-full border border-[#A6C5D7] rounded-xl px-4 py-2.5 text-sm text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA] resize-none transition-colors"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
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
              onChange={(patch) => onFieldChange(field._id, patch)}
              onRemove={() => onFieldRemove(field._id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onFieldAdd}
          className="mt-3 flex items-center gap-1.5 text-sm text-[#0F52BA] hover:text-blue-700 transition-colors font-medium"
        >
          <Plus size={16} strokeWidth={1.5} />
          Добавить поле
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#D6E6F3]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-[#A6C5D7] text-[#0D1B2A] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#D6E6F3]/30 transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !templateName.trim()}
          className="flex-1 bg-[#0F52BA] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Сохранение…
            </>
          ) : (
            'Сохранить шаблон'
          )}
        </button>
      </div>
    </div>
  )
}
