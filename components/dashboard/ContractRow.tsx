'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Eye, MessageSquare, Mail, MoreVertical, Download, Trash2 } from 'lucide-react'
import type { Contract } from '@/lib/dashboard/types'
import { formatTenge } from '@/lib/dashboard/mocks'
import { StatusBadge } from './StatusBadge'
import { useDashboardUser } from './DashboardUserContext'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

function isInRetention(retentionUntil: string | null | undefined): boolean {
  if (!retentionUntil) return false
  return new Date(retentionUntil) > new Date()
}

export function ContractRow({
  contract,
  onDelete,
}: {
  contract: Contract
  onDelete?: (id: string) => void
}) {
  const { role } = useDashboardUser()
  const ChannelIcon = contract.channel === 'sms' ? MessageSquare : Mail

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const canDelete = role === 'owner' && !isInRetention(contract.retentionUntil)
  const hasPdf = contract.status === 'signed' && !!contract.pdfUrl

  const handleDelete = async () => {
    setDeleteError(null)
    const r = await fetch(`/api/contracts/${contract.id}`, { method: 'DELETE' })
    if (r.ok) {
      setConfirmOpen(false)
      onDelete?.(contract.id)
    } else {
      const d = await r.json().catch(() => ({}))
      setDeleteError(d.error ?? 'Ошибка удаления')
      setConfirmOpen(false)
    }
  }

  const showMenu = hasPdf || role === 'owner'

  return (
    <>
      <div className="relative border-b border-ice last:border-0 group">
        <Link
          href={`/dashboard/contracts/${contract.id}`}
          className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_2fr_1fr_auto_auto_auto] items-center gap-3 md:gap-4 px-4 py-3 pr-10 hover:bg-gray-50 transition-colors"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-dark truncate">{contract.studentName}</p>
            <p className="text-xs text-muted truncate">№ {contract.number}</p>
          </div>

          <p className="hidden md:block text-sm text-muted truncate">{contract.courseName}</p>

          <p className="hidden md:block text-sm font-medium text-text-dark tabular-nums">
            {formatTenge(contract.amount)}
          </p>

          <div className="hidden md:flex items-center justify-center w-6 h-6 rounded-md bg-ice">
            <ChannelIcon size={12} strokeWidth={1.5} className="text-sapphire" />
          </div>

          <StatusBadge status={contract.status} />

          <div className="hidden md:flex items-center gap-1 text-xs text-muted">
            <span className="tabular-nums">{formatDate(contract.sentAt ?? contract.createdAt)}</span>
            <Eye size={14} strokeWidth={1.5} className="ml-2 text-muted/50" />
          </div>
        </Link>

        {/* Three-dot menu */}
        {showMenu && (
          <div ref={menuRef} className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v) }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-ice hover:text-text-dark transition-colors"
            >
              <MoreVertical size={15} strokeWidth={1.5} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-ice rounded-xl shadow-lg py-1 z-20">
                {hasPdf && (
                  <a
                    href={contract.pdfUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-dark hover:bg-gray-50 transition-colors"
                  >
                    <Download size={14} strokeWidth={1.5} className="text-sapphire" />
                    Скачать PDF
                  </a>
                )}
                {role === 'owner' && (
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmOpen(true) }}
                    disabled={isInRetention(contract.retentionUntil)}
                    title={isInRetention(contract.retentionUntil) ? `Договор в архиве до ${new Date(contract.retentionUntil!).toLocaleDateString('ru-RU')}` : undefined}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                    Удалить договор
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {deleteError && (
        <p className="text-xs text-red-600 px-4 py-1 bg-red-50">{deleteError}</p>
      )}

      <ConfirmDeleteDialog
        open={confirmOpen}
        title="Удалить договор?"
        description={`Договор №${contract.number} (${contract.studentName}) будет удалён безвозвратно. PDF из хранилища тоже будет удалён.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
