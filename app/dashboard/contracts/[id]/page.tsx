import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { EmptyState } from '@/components/dashboard/EmptyState'

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text-dark transition-colors mb-3"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          К договорам
        </Link>
        <h1 className="text-2xl font-bold text-text-dark tracking-tight">Договор {id}</h1>
      </div>

      <div className="bg-white border border-ice rounded-2xl shadow-sm overflow-hidden">
        <EmptyState
          icon={FileText}
          title="Страница договора"
          description="Здесь появится PDF-превью, таймлайн действий, данные клиента и кнопки (напомнить / отозвать / скачать). Подключим после того, как договоры будут реально создаваться."
        />
      </div>
    </div>
  )
}
