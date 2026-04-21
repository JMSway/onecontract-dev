import { ArrowUp, ArrowDown, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  delta?: number
  deltaLabel?: string
  delay?: number
}

export function StatCard({ icon: Icon, label, value, delta, deltaLabel, delay = 0 }: StatCardProps) {
  const up = (delta ?? 0) >= 0
  const hasDelta = typeof delta === 'number' && delta !== 0

  return (
    <div
      className="bg-white border border-ice rounded-2xl p-5 shadow-sm animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg bg-ice flex items-center justify-center">
          <Icon size={18} strokeWidth={1.5} className="text-sapphire" />
        </div>
        {hasDelta && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              up ? 'text-success' : 'text-danger'
            }`}
          >
            {up ? (
              <ArrowUp size={12} strokeWidth={2.5} />
            ) : (
              <ArrowDown size={12} strokeWidth={2.5} />
            )}
            {Math.abs(delta)}
            {deltaLabel ? ` ${deltaLabel}` : ''}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-text-dark tracking-tight mb-1 tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}
