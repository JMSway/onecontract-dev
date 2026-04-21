'use client'

import { ChevronDown, Calendar, Trash2, User, Briefcase } from 'lucide-react'
import type { TemplateField } from '@/lib/types'

export interface EditableField extends TemplateField {
  _id: string
}

const FIELD_TYPES: { value: TemplateField['type']; label: string }[] = [
  { value: 'text', label: 'Текст' },
  { value: 'number', label: 'Число / Сумма' },
  { value: 'date', label: 'Дата' },
  { value: 'phone', label: 'Телефон' },
  { value: 'iin', label: 'ИИН / Удостоверение' },
  { value: 'email', label: 'Email' },
]

interface FieldRowProps {
  field: EditableField
  onChange: (patch: Partial<EditableField>) => void
  onRemove: () => void
}

export function FieldRow({ field, onChange, onRemove }: FieldRowProps) {
  const isClient = field.filled_by === 'client'

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 group transition-all duration-150 hover:bg-[#D6E6F3]/30">
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Название поля"
          className="w-full bg-transparent text-sm text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none"
        />
        {field.type === 'date' && (
          <span className="flex items-center gap-1 text-[10px] text-[#0F7B55] mt-0.5">
            <Calendar size={10} /> автозаполняется при отправке
          </span>
        )}
        {isClient && (
          <span className="flex items-center gap-1 text-[10px] text-[#0F7B55] mt-0.5">
            <User size={10} /> заполняет клиент
          </span>
        )}
      </div>
      <div className="relative shrink-0">
        <select
          value={field.type}
          onChange={(e) => onChange({ type: e.target.value as TemplateField['type'] })}
          className="appearance-none bg-white border border-[#A6C5D7] rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 cursor-pointer transition-colors"
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
        className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-colors duration-150 ${
          field.required ? 'bg-[#0F52BA]/10 text-[#0F52BA]' : 'bg-gray-200 text-[#6B7E92]'
        }`}
      >
        *
      </button>
      <button
        type="button"
        onClick={() => onChange({ filled_by: isClient ? 'manager' : 'client' })}
        title={isClient ? 'Заполняет клиент' : 'Заполняет менеджер'}
        className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150 ${
          isClient
            ? 'bg-[#0F7B55]/10 text-[#0F7B55]'
            : 'bg-gray-100 text-[#6B7E92] hover:bg-gray-200'
        }`}
      >
        {isClient ? <User size={13} strokeWidth={1.5} /> : <Briefcase size={13} strokeWidth={1.5} />}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7E92] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150"
        title="Удалить поле"
      >
        <Trash2 size={15} strokeWidth={1.5} />
      </button>
    </div>
  )
}
