'use client'

import { Calendar, User, Briefcase } from 'lucide-react'
import type { EditableField } from './FieldRow'

interface FieldMappingPanelProps {
  fields: EditableField[]
}

export function FieldMappingPanel({ fields }: FieldMappingPanelProps) {
  if (!fields.length) return null

  return (
    <div className="bg-white border border-[#D6E6F3] rounded-2xl p-4 shadow-sm mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7E92] mb-3">
        Маппинг полей
      </h3>
      <div className="flex gap-4 mb-3 text-[10px] text-[#6B7E92]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#0F52BA] inline-block" />
          менеджер
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#0F7B55] inline-block" />
          клиент
        </span>
      </div>
      <div className="space-y-1.5">
        {fields.map((field) => {
          const isClient = field.filled_by === 'client'
          const isAutoFill = field.type === 'date' || field.key === 'contract_number'
          const displayLabel = field.label || field.key || '...'

          return (
            <div key={field._id} className="flex items-center gap-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isClient ? 'bg-[#0F7B55]' : 'bg-[#0F52BA]'
                }`}
              />
              {isClient ? (
                <User size={10} strokeWidth={1.5} className="text-[#0F7B55] flex-shrink-0" />
              ) : (
                <Briefcase size={10} strokeWidth={1.5} className="text-[#0F52BA] flex-shrink-0" />
              )}
              <span className="text-[#0D1B2A] truncate flex-1">{displayLabel}</span>
              {isAutoFill ? (
                <span className="text-[#0F7B55] text-[10px] flex items-center gap-0.5 flex-shrink-0">
                  <Calendar size={10} strokeWidth={1.5} />
                  авто
                </span>
              ) : (
                <span
                  className={`text-[10px] flex-shrink-0 ${
                    isClient ? 'text-[#0F7B55]' : 'text-[#6B7E92]'
                  }`}
                >
                  {isClient ? 'клиент' : 'менеджер'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
