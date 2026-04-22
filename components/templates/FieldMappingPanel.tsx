'use client'

import { User, Briefcase, Info } from 'lucide-react'
import type { EditableField } from './FieldRow'
import type { DocxPatch } from '@/lib/types'

interface FieldMappingPanelProps {
  fields: EditableField[]
  patches?: DocxPatch[]
}

export function FieldMappingPanel({ fields, patches }: FieldMappingPanelProps) {
  if (!fields.length) return null

  const managerFields = fields.filter((f) => (f.filled_by ?? 'manager') === 'manager')
  const clientFields = fields.filter((f) => f.filled_by === 'client')

  const patchCount = (key: string) =>
    (patches ?? []).filter((p) => p.replace.includes(`{{${key}}}`)).length

  return (
    <div className="bg-white border border-[#D6E6F3] rounded-2xl p-4 shadow-sm mt-4 space-y-3">
      {managerFields.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase size={12} strokeWidth={1.5} className="text-[#0F52BA]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F52BA]">
              Менеджер заполняет
            </span>
          </div>
          <div className="space-y-1">
            {managerFields.map((f) => {
              const count = patchCount(f.key)
              return (
                <div
                  key={f._id}
                  className="flex items-center justify-between text-xs px-2 py-1.5 bg-[#F8FAFC] rounded-lg"
                >
                  <span className="text-[#0D1B2A] truncate">{f.label || f.key}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {count > 1 && (
                      <span className="text-[9px] bg-[#EDE9FE] text-[#7C3AED] rounded px-1 py-0.5">
                        ×{count}
                      </span>
                    )}
                    <span className="text-[#A6C5D7] text-[10px]">{f.type}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {clientFields.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <User size={12} strokeWidth={1.5} className="text-[#0F7B55]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F7B55]">
              Клиент заполняет при подписании
            </span>
          </div>
          <div className="space-y-1">
            {clientFields.map((f) => {
              const count = patchCount(f.key)
              return (
                <div
                  key={f._id}
                  className="flex items-center justify-between text-xs px-2 py-1.5 bg-[#F0FDF4] rounded-lg"
                >
                  <span className="text-[#0D1B2A] truncate">{f.label || f.key}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {count > 1 && (
                      <span className="text-[9px] bg-[#EDE9FE] text-[#7C3AED] rounded px-1 py-0.5">
                        ×{count}
                      </span>
                    )}
                    <span className="text-[#A6C5D7] text-[10px]">{f.type}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-1.5 pt-2 border-t border-[#D6E6F3]">
        <Info size={12} strokeWidth={1.5} className="text-[#A6C5D7] mt-0.5 shrink-0" />
        <p className="text-[10px] text-[#6B7E92] leading-relaxed">
          Цветные метки в превью показывают куда вставляется каждое поле. ×N — поле встречается N раз в документе.
        </p>
      </div>
    </div>
  )
}
