'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Upload, FileText, Plus, Trash2, Loader2 } from 'lucide-react'
import type { Template } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function pluralFields(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'поле'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'поля'
  return 'полей'
}

interface TemplateCardProps {
  template: Template
  onDelete: (id: string) => void
}

function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Удалить шаблон «${template.name}»?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
      onDelete(template.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white border border-[#D6E6F3] rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-[#A6C5D7] transition-colors">
      <div className="w-10 h-10 rounded-xl bg-[#D6E6F3] flex items-center justify-center shrink-0">
        <FileText size={20} className="text-[#0F52BA]" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0D1B2A] truncate">{template.name}</p>
        <p className="text-xs text-[#6B7E92] mt-0.5">
          {template.fields.length} {pluralFields(template.fields.length)} · создан{' '}
          {formatDate(template.created_at)}
        </p>
        {template.description && (
          <p className="text-xs text-[#6B7E92] mt-0.5 truncate">{template.description}</p>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 p-2 rounded-xl text-[#6B7E92] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Удалить шаблон"
      >
        {deleting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} strokeWidth={1.5} />
        )}
      </button>
    </div>
  )
}

function EmptyTemplates() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#D6E6F3] flex items-center justify-center mb-4">
        <FileText size={32} className="text-[#0F52BA]" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-[#0D1B2A] mb-2">Нет шаблонов</h3>
      <p className="text-sm text-[#6B7E92] max-w-xs mb-6">
        Загрузите ваш договор — AI автоматически найдёт все поля для заполнения.
      </p>
      <Link
        href="/dashboard/templates/new"
        className="bg-[#0F52BA] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Upload size={16} strokeWidth={1.5} />
        Загрузить первый шаблон
      </Link>
    </div>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Шаблоны</h1>
          <p className="text-sm text-[#6B7E92] mt-0.5">Шаблоны договоров вашей организации</p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="bg-[#0F52BA] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">Загрузить шаблон</span>
          <span className="sm:hidden">Загрузить</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-[#0F52BA] animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyTemplates />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onDelete={(id) => setTemplates((p) => p.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </>
  )
}
