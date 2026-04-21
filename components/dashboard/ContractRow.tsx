import Link from 'next/link'
import { Eye, MessageSquare, Mail } from 'lucide-react'
import type { Contract } from '@/lib/dashboard/types'
import { formatTenge } from '@/lib/dashboard/mocks'
import { StatusBadge } from './StatusBadge'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

export function ContractRow({ contract }: { contract: Contract }) {
  const ChannelIcon = contract.channel === 'sms' ? MessageSquare : Mail

  return (
    <Link
      href={`/dashboard/contracts/${contract.id}`}
      className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_2fr_1fr_auto_auto_auto] items-center gap-3 md:gap-4 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-ice last:border-0"
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
  )
}
