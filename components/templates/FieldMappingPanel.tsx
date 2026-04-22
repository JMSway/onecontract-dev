'use client'

import { User, Briefcase, Info } from 'lucide-react'
import type { EditableField } from './FieldRow'
import type { DocxPatch } from '@/lib/types'
import { GROUP_CONFIG, GROUP_ORDER } from '@/lib/field-groups'

interface FieldMappingPanelProps {
  fields: EditableField[]
  patches?: DocxPatch[]
}

export function FieldMappingPanel({ fields, patches }: FieldMappingPanelProps) {
  if (!fields.length) return null

  const patchCount = (key: string) =>
    (patches ?? []).filter((p) => p.replace.includes(`{{${key}}}`)).length

  const groupedFields = new Map<string, EditableField[]>()
  for (const f of fields) {
    const g = f.group ?? 'other'
    const list = groupedFields.get(g)
    if (list) list.push(f)
    else groupedFields.set(g, [f])
  }

  const orderedGroups = GROUP_ORDER.filter((g) => groupedFields.get(g)?.length)

  return (
    <div className="bg-white border border-[#D6E6F3] rounded-2xl p-4 shadow-sm mt-4 space-y-4">
      {orderedGroups.map((group) => {
        const cfg = GROUP_CONFIG[group] ?? GROUP_CONFIG.other
        const list = groupedFields.get(group) ?? []
        return (
          <div key={group}>
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
              <span className="text-[10px] text-[#A6C5D7]">({list.length})</span>
            </div>
            <div className="space-y-1">
              {list.map((f) => {
                const count = patchCount(f.key)
                const isClient = f.filled_by === 'client'
                return (
                  <div
                    key={f._id}
                    className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 bg-[#F8FAFC] rounded-lg"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isClient ? (
                        <User size={11} strokeWidth={1.5} className="text-[#0F7B55] shrink-0" />
                      ) : (
                        <Briefcase size={11} strokeWidth={1.5} className="text-[#0F52BA] shrink-0" />
                      )}
                      <span className="text-[#0D1B2A] truncate">{f.label || f.key}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {count > 1 && (
                        <span
                          className="text-[9px] rounded px-1 py-0.5"
                          style={{ backgroundColor: cfg.color + '1A', color: cfg.color }}
                          title={`Встречается ${count} раз`}
                        >
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
        )
      })}

      <div className="flex items-start gap-1.5 pt-2 border-t border-[#D6E6F3]">
        <Info size={12} strokeWidth={1.5} className="text-[#A6C5D7] mt-0.5 shrink-0" />
        <p className="text-[10px] text-[#6B7E92] leading-relaxed">
          <Briefcase size={9} strokeWidth={1.5} className="inline -mt-0.5" /> — заполняет менеджер,{' '}
          <User size={9} strokeWidth={1.5} className="inline -mt-0.5" /> — клиент при подписании. ×N — поле встречается в документе N раз.
        </p>
      </div>
    </div>
  )
}
