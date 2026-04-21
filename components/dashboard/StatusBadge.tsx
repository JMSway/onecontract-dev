import type { ContractStatus } from '@/lib/dashboard/types'

const MAP: Record<ContractStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft: { label: 'Черновик', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  pending_approval: {
    label: 'Ждёт подтверждения',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  sent: { label: 'Отправлен', bg: 'bg-sapphire/10', text: 'text-sapphire', dot: 'bg-sapphire' },
  viewed: { label: 'Просмотрен', bg: 'bg-powder/20', text: 'text-sapphire', dot: 'bg-sapphire' },
  signed: { label: 'Подписан', bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  declined: { label: 'Отклонён', bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
  expired: { label: 'Истёк', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
}

export function StatusBadge({ status }: { status: ContractStatus }) {
  const s = MAP[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${s.bg} ${s.text} text-xs font-medium px-2.5 py-1 rounded-full`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
