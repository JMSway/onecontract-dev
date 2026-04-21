import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  cta?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon: Icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-ice flex items-center justify-center mb-5">
        <Icon size={28} strokeWidth={1.5} className="text-sapphire" />
      </div>
      <h3 className="text-lg font-semibold text-text-dark mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-muted max-w-sm leading-relaxed mb-6">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 bg-sapphire hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
