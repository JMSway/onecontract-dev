'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type Props = {
  open: boolean
  title?: string
  description?: string
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

export function ConfirmDeleteDialog({ open, title, description, onConfirm, onCancel }: Props) {
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      setChecked(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted hover:text-text-dark transition-colors"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={20} strokeWidth={1.5} className="text-red-600" />
          </div>
          <h2 className="text-base font-bold text-text-dark">
            {title ?? 'Удалить договор?'}
          </h2>
        </div>

        {description && (
          <p className="text-sm text-muted leading-relaxed">{description}</p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-powder accent-[#B91C1C] shrink-0 cursor-pointer"
          />
          <span className="text-sm text-text-dark leading-snug">
            Я понимаю, что договор будет удалён безвозвратно
          </span>
        </label>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-10 border border-powder text-text-dark rounded-xl text-sm font-medium hover:bg-ice transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={!checked || loading}
            className="flex-1 h-10 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}
